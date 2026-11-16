import { getCharset } from '../hardware/fonts/charsets';
import { has, t } from '../../i18n';
import type { Field, Lookup, LookupField, ParamSchema, SettingField, TextField, Values } from '../params';
import { debounce, el, insertAtCursor, uid } from './dom';

/**
 * Draws the form for a ParamSchema. Every replica's settings and every
 * source's settings come out of this one function, which is what lets a new
 * one be added without writing any interface for it.
 */
export interface FormContext {
  /** Searches behind `lookup` fields, by name. */
  lookups?: Record<string, Lookup>;
  /** Editors for `json` fields, by name. */
  editors?: Record<string, JsonEditor>;
}

export type JsonEditor = (value: unknown, onChange: (value: unknown) => void) => HTMLElement;

export interface Form {
  element: HTMLElement;
  /** Shows other values without reporting a change. */
  set(values: Values): void;
}

const label = (key: string): string => t(key);
const literalOrKey = (text: string): string => (has(text) ? t(text) : text);

function glyphPicker(field: TextField, input: HTMLInputElement, compact = false): HTMLElement | undefined {
  const charset = field.glyphs ? getCharset(field.glyphs) : undefined;
  if (!charset) return undefined;
  const panel = el('div', { class: 'glyphs', attrs: { hidden: true } });
  const toggle = el('button', {
    class: 'button glyphs-toggle',
    // In a table row there is room for the symbol only.
    text: compact ? 'Ω' : t('player.glyphs'),
    attrs: { type: 'button', title: t('player.glyphs.title'), 'aria-label': compact ? t('player.glyphs.title') : undefined, 'aria-expanded': 'false' },
    on: {
      click: () => {
        // Built on first use: it is a couple of hundred buttons.
        if (!panel.childElementCount) {
          for (const code of charset.pickerCodes) {
            const char = charset.decode(code);
            panel.append(
              el('button', {
                text: char,
                attrs: { type: 'button', title: charset.nameOf?.(code) ?? `0x${code.toString(16).toUpperCase().padStart(2, '0')}` },
                on: { click: () => insertAtCursor(input, char) },
              }),
            );
          }
        }
        panel.hidden = !panel.hidden;
        toggle.setAttribute('aria-expanded', String(!panel.hidden));
      },
    },
  });
  return el('span', { class: 'glyphs-wrap' }, [toggle, panel]);
}

function lookupControl(field: LookupField, lookup: Lookup | undefined, values: () => Values, commit: (patch: Values) => void) {
  const listId = uid('lookup');
  const input = el('input', {
    attrs: {
      type: 'search', role: 'combobox', autocomplete: 'off', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': listId,
      placeholder: field.placeholder ? literalOrKey(field.placeholder) : undefined,
    },
  });
  const list = el('ul', { class: 'lookup-list', attrs: { id: listId, role: 'listbox', hidden: true } });
  const current = el('p', { class: 'lookup-current', attrs: { 'aria-live': 'polite' } });
  let items: ReturnType<Lookup['search']> = [];
  let active = -1;

  const close = (): void => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const showCurrent = (): void => {
    const value = String(values()[field.key] ?? '');
    const item = value ? lookup?.resolve(value, values()) : undefined;
    current.replaceChildren();
    if (!value) return;
    current.append(el('strong', { text: item?.label ?? value }));
    if (item?.detail) current.append(` · ${item.detail}`);
    if (item?.url) current.append(' · ', el('a', { text: t('mitren.viewOnMitren'), attrs: { href: item.url, target: '_blank', rel: 'noopener noreferrer' } }));
  };
  const pick = (index: number): void => {
    const item = items[index];
    if (!item) return;
    input.value = '';
    close();
    commit({ ...item.set, [field.key]: item.value });
    showCurrent();
  };
  const highlight = (index: number): void => {
    active = index;
    Array.from(list.children).forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    const option = list.children[index];
    if (option) input.setAttribute('aria-activedescendant', option.id);
  };
  const search = (): void => {
    const query = input.value.trim();
    items = query && lookup ? lookup.search(query, 8, values()) : [];
    list.replaceChildren();
    if (!query) return close();
    if (items.length === 0) {
      list.append(el('li', { class: 'lookup-empty', text: t('mitren.noMatches') }));
    }
    items.forEach((item, index) => {
      list.append(
        el('li', { attrs: { id: `${listId}-${index}`, role: 'option', 'aria-selected': 'false' }, on: { mousedown: (event) => { event.preventDefault(); pick(index); } } }, [
          el('span', { text: item.label }),
          item.detail ? el('small', { text: item.detail }) : null,
        ]),
      );
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    active = -1;
  };
  input.addEventListener('input', search);
  input.addEventListener('blur', () => setTimeout(close, 100));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (list.hidden) search();
      if (items.length) highlight((active + (event.key === 'ArrowDown' ? 1 : items.length - 1) + (active < 0 && event.key === 'ArrowUp' ? 1 : 0)) % items.length);
      event.preventDefault();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const typed = input.value.trim();
      if (active >= 0) pick(active);
      else if (items.length === 1) pick(0);
      else if (typed && lookup?.accepts?.(typed)) {
        input.value = '';
        close();
        commit({ [field.key]: typed });
        showCurrent();
      } else if (items.length) pick(0);
    } else if (event.key === 'Escape') {
      close();
    }
  });
  showCurrent();
  return { control: el('div', { class: 'lookup' }, [input, list, current]), input, refresh: showCurrent };
}

export function renderForm(schema: ParamSchema, initial: Values, onChange: (values: Values) => void, context: FormContext = {}): Form {
  let values: Values = { ...initial };
  const setters: ((values: Values) => void)[] = [];
  const commit = (patch: Values): void => {
    values = { ...values, ...patch };
    onChange(values);
  };
  const commitSoon = debounce(commit, 250);
  /** The controls of each setting, for switches that enable and disable them. */
  const inputs = new Map<string, HTMLInputElement | HTMLSelectElement>();
  const sync = (): void => {
    for (const setter of setters) setter(values);
  };

  const control = (field: Field, inRow = false): HTMLElement | undefined => {
    if (field.hidden) {
      // A seed is not something to type, but rolling a new one is worth a button.
      if (field.type !== 'number' || !field.shuffle) return undefined;
      return el('div', { class: 'field' }, [
        el('button', {
          class: 'button',
          text: t('player.shuffle'),
          attrs: { type: 'button', title: t(field.label) },
          on: { click: () => commit({ [field.key]: Math.floor(Math.random() * 1e9) }) },
        }),
      ]);
    }
    const id = uid('f');
    const caption = el('label', { text: label(field.label), attrs: { for: id } });
    const help = field.help ? el('small', { class: 'field-help', text: t(field.help) }) : null;
    const row = (inner: (Node | null | undefined)[], inline = false): HTMLElement =>
      el('div', { class: inline ? 'field is-inline' : 'field' }, inline ? [...inner, caption, help] : [caption, ...inner, help]);

    switch (field.type) {
      case 'text': {
        const input = el('input', {
          // A short field is drawn as wide as what it holds, so a row of them reads like the display.
          attrs: {
            id, type: 'text', maxlength: field.maxLength, placeholder: field.placeholder, spellcheck: 'false', autocomplete: 'off',
            size: field.maxLength && field.maxLength <= 24 ? field.maxLength + 1 : undefined,
            // In a table row, a box of two or three characters is drawn exactly that wide.
            style: inRow && field.maxLength && field.maxLength <= 6 ? `width:calc(${field.maxLength + 1}ch + 1.2em)` : undefined,
            class: inRow && !(field.maxLength && field.maxLength <= 6) ? 'is-grow' : undefined,
          },
          on: { input: () => commitSoon({ [field.key]: input.value }) },
        });
        setters.push((next) => {
          if (document.activeElement !== input) input.value = String(next[field.key] ?? '');
        });
        return row([el('span', { class: 'field-control' }, [input, glyphPicker(field, input, inRow)])]);
      }
      case 'number': {
        const input = el('input', {
          attrs: { id, type: 'number', min: field.min, max: field.max, step: field.step },
          on: { input: () => input.value !== '' && commitSoon({ [field.key]: Number(input.value) }) },
        });
        setters.push((next) => {
          if (document.activeElement !== input) input.value = String(next[field.key] ?? '');
        });
        return row([input]);
      }
      case 'range': {
        const output = el('output', { attrs: { for: id } });
        const show = (value: unknown): void => {
          output.textContent = `${value}${field.unit ? ` ${field.unit}` : ''}`;
        };
        const input = el('input', {
          attrs: { id, type: 'range', min: field.min, max: field.max, step: field.step },
          on: {
            input: () => {
              show(Number(input.value));
              commit({ [field.key]: Number(input.value) });
            },
          },
        });
        inputs.set(field.key, input);
        setters.push((next) => {
          input.value = String(next[field.key] ?? field.default);
          show(next[field.key] ?? field.default);
        });
        return row([el('span', { class: 'field-control' }, [input, output])]);
      }
      case 'switch': {
        const controlled = schema.fields.filter((other): other is SettingField => other.type !== 'switch' && field.controls.includes(other.key));
        const isOn = (current: Values): boolean => controlled.some((other) => current[other.key] !== other.default);
        let remembered: Values | undefined;
        const input = el('input', {
          attrs: { id, type: 'checkbox' },
          on: {
            change: () => {
              if (input.checked) {
                commit(remembered ?? field.on);
              } else {
                remembered = Object.fromEntries(controlled.map((other) => [other.key, values[other.key]]));
                commit(Object.fromEntries(controlled.map((other) => [other.key, other.default])));
              }
              sync();
            },
          },
        });
        setters.push((next) => {
          input.checked = isOn(next);
          // The amounts only matter while the switch is on.
          for (const other of controlled) {
            const target = inputs.get(other.key);
            if (target) target.disabled = !input.checked;
          }
        });
        return row([input], true);
      }
      case 'boolean': {
        const input = el('input', { attrs: { id, type: 'checkbox' }, on: { change: () => commit({ [field.key]: input.checked }) } });
        setters.push((next) => {
          input.checked = next[field.key] === true;
        });
        return row([input], true);
      }
      case 'color':
      case 'select': {
        const choices = field.choices ?? [];
        if (field.type === 'color' && choices.length === 0) {
          const input = el('input', { attrs: { id, type: 'color' }, on: { input: () => commit({ [field.key]: input.value }) } });
          setters.push((next) => {
            input.value = String(next[field.key] ?? field.default);
          });
          return row([input]);
        }
        const select = el('select', { attrs: { id }, on: { change: () => commit({ [field.key]: select.value }) } });
        const literal = field.type === 'select' && field.literal;
        const fill = (current: string): void => {
          select.replaceChildren(...choices.map((choice) => el('option', { text: literal ? choice.label : t(choice.label), attrs: { value: choice.value } })));
          // A colour that came in through a URL and is not one of the period ones is still shown.
          if (!choices.some((choice) => choice.value === current)) select.append(el('option', { text: current, attrs: { value: current } }));
          select.value = current;
        };
        setters.push((next) => fill(String(next[field.key] ?? field.default)));
        return row([select]);
      }
      case 'lookup': {
        const built = lookupControl(field, context.lookups?.[field.lookup], () => values, commit);
        built.input.id = id;
        setters.push(() => built.refresh());
        return row([built.control]);
      }
      case 'json': {
        const editor = context.editors?.[field.editor];
        if (!editor) return undefined;
        const holder = el('div', { class: 'field is-wide' });
        const draw = (value: unknown): void => holder.replaceChildren(editor(value, (next) => commit({ [field.key]: next })));
        let shown = '';
        setters.push((next) => {
          // Redrawing would throw away what is being typed, so only do it for values that came from outside.
          const key = JSON.stringify(next[field.key]);
          if (key === shown || holder.contains(document.activeElement)) return void (shown = key);
          shown = key;
          draw(next[field.key]);
        });
        return holder;
      }
    }
  };

  // Fields and groups appear in the order of the schema: a group where its first field is.
  const element = el('div', { class: 'form' });
  const groups = schema.groups ?? [];
  const fields = (list: Field[], inRow = false): HTMLElement[] =>
    list.map((field) => control(field, inRow)).filter((node): node is HTMLElement => node !== undefined);
  const drawn = new Set<string>();
  let table: HTMLElement | undefined;
  for (const field of schema.fields) {
    const group = groups.find((candidate) => candidate.id === field.group);
    if (!group) {
      table = undefined;
      element.append(...fields([field]));
      continue;
    }
    if (drawn.has(group.id)) continue;
    drawn.add(group.id);
    const members = schema.fields.filter((other) => other.group === group.id);
    if (group.layout === 'row') {
      const inner = fields(members, true);
      if (!inner.length) continue;
      // Consecutive row groups make one table; the field labels of the first row head the columns.
      if (!table) {
        // On a narrow screen the long fields take what is left of the width; short ones keep theirs.
        const narrow = members
          .filter((member) => !member.hidden)
          .map((member) => (member.type === 'text' && member.maxLength !== undefined && member.maxLength <= 6 ? 'max-content' : 'minmax(0, 1fr)'))
          .join(' ');
        table = el('div', { class: 'form-rows', attrs: { style: `--columns:${inner.length};--narrow:${narrow}` } });
        element.append(table);
      }
      table.append(
        el('div', { class: 'form-row', attrs: { role: 'group', 'aria-label': t(group.label) } }, [
          el('span', { class: 'form-row-label', text: t(group.label), attrs: { 'aria-hidden': 'true' } }),
          ...inner,
        ]),
      );
    } else {
      table = undefined;
      const inner = fields(members);
      if (inner.length) element.append(el('fieldset', {}, [el('legend', { text: t(group.label) }), ...inner]));
    }
  }

  const set = (next: Values): void => {
    values = { ...next };
    sync();
  };
  set(values);
  return { element, set };
}
