import { t } from '../../i18n';
import { EXAMPLE_ROWS, type ManualRow } from '../sources/manual/def';
import { debounce, el, uid } from './dom';

/**
 * The editor of the manual source: a list of services, each with the few
 * fields most displays use up front and everything else the model knows a
 * click away. Nothing is required; a display shows what it is given.
 */
type Key = keyof ManualRow;

interface Column {
  key: Key;
  kind?: 'number' | 'color' | 'check' | 'select';
  width?: number;
  placeholder?: string;
  choices?: string[];
}

const MAIN: Column[] = [
  { key: 'dest', width: 16, placeholder: 'Chamartín' },
  { key: 'min', kind: 'number', width: 4 },
  { key: 'time', width: 5, placeholder: 'HH:MM' },
  { key: 'via', width: 3 },
  { key: 'stops', width: 28, placeholder: 'Recoletos, Atocha' },
];

const MORE: Column[] = [
  { key: 'line', width: 5, placeholder: 'C-1' },
  { key: 'color', kind: 'color' },
  { key: 'num', width: 7 },
  { key: 'prod', width: 10, placeholder: 'Cercanías' },
  { key: 'op', width: 10, placeholder: 'Renfe' },
  { key: 'origin', width: 14 },
  { key: 'arr', width: 5, placeholder: 'HH:MM' },
  { key: 'delay', kind: 'number', width: 4 },
  { key: 'state', kind: 'select', choices: ['', 'cancelled', 'passes', 'terminus', 'origin'] },
  { key: 'conf', kind: 'check' },
  { key: 'note', width: 24 },
];

const POSITIONS = ['', 'front', 'middle', 'rear'];

function clean(row: ManualRow): ManualRow {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === '' || value === undefined || value === null) continue;
    if (key === 'conf' && value === true) continue;
    if (key === 'split') {
      const parts = (value as NonNullable<ManualRow['split']>).filter((part) => part.dest?.trim());
      if (parts.length) out.split = parts;
      continue;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    out[key] = value;
  }
  return out as ManualRow;
}

export function servicesEditor(value: unknown, onChange: (value: unknown) => void): HTMLElement {
  const rows: ManualRow[] = Array.isArray(value) ? (value as ManualRow[]).map((row) => ({ ...row })) : [];
  const root = el('div', { class: 'services-editor' });
  const emit = (): void => onChange(rows.map(clean));
  const emitSoon = debounce(emit, 250);

  const input = (row: Record<string, unknown>, column: Column, prefix = 'manual.row.'): HTMLElement => {
    const id = uid('svc');
    const caption = el('label', { text: t(prefix + column.key), attrs: { for: id } });
    const current = row[column.key];
    let control: HTMLInputElement | HTMLSelectElement;
    if (column.kind === 'select') {
      control = el('select', { attrs: { id } }, (column.choices ?? []).map((choice) => el('option', { text: t(`${prefix}${column.key}.${choice || 'none'}`), attrs: { value: choice } })));
      control.value = String(current ?? '');
      control.addEventListener('change', () => {
        row[column.key] = control.value;
        emit();
      });
    } else if (column.kind === 'check') {
      const box = el('input', { attrs: { id, type: 'checkbox' } });
      box.checked = current !== false;
      box.addEventListener('change', () => {
        row[column.key] = box.checked;
        emit();
      });
      return el('div', { class: 'cell is-inline' }, [box, caption]);
    } else if (column.kind === 'color') {
      const box = el('input', { attrs: { id, type: 'color' } });
      box.value = typeof current === 'string' && current ? current : '#808080';
      box.addEventListener('input', () => {
        row[column.key] = box.value;
        emit();
      });
      control = box;
    } else {
      const box = el('input', {
        attrs: { id, type: column.kind === 'number' ? 'number' : 'text', size: column.width, placeholder: column.placeholder, autocomplete: 'off', spellcheck: 'false' },
      });
      box.value = current === undefined ? '' : String(current);
      box.addEventListener('input', () => {
        row[column.key] = column.kind === 'number' ? (box.value === '' ? undefined : Number(box.value)) : box.value;
        emitSoon();
      });
      control = box;
    }
    return el('div', { class: 'cell' }, [caption, control]);
  };

  const draw = (): void => {
    root.replaceChildren();
    rows.forEach((row, index) => {
      const record = row as Record<string, unknown>;
      const parts = (row.split ??= []);
      const portions = el('div', { class: 'portions' });
      const drawPortions = (): void => {
        portions.replaceChildren();
        if (parts.length === 0) return;
        // The first part is the row itself; where it rides only matters once there is a second.
        portions.append(
          el('div', { class: 'cells' }, [
            el('span', { class: 'portion-label', text: t('manual.split.first') }),
            input(record, { key: 'pos', kind: 'select', choices: POSITIONS }),
          ]),
        );
        parts.forEach((part, at) => {
          portions.append(
            el('div', { class: 'cells' }, [
              el('span', { class: 'portion-label', text: t('manual.split.other') }),
              input(part as Record<string, unknown>, { key: 'dest', width: 16 }),
              input(part as Record<string, unknown>, { key: 'stops', width: 22 }),
              input(part as Record<string, unknown>, { key: 'num', width: 7 }),
              input(part as Record<string, unknown>, { key: 'pos', kind: 'select', choices: POSITIONS }),
              el('button', {
                class: 'button is-small', text: '✕',
                attrs: { type: 'button', title: t('manual.split.remove'), 'aria-label': t('manual.split.remove') },
                on: { click: () => { parts.splice(at, 1); drawPortions(); emit(); } },
              }),
            ]),
          );
        });
      };
      drawPortions();
      root.append(
        el('div', { class: 'service', attrs: { role: 'group', 'aria-label': t('manual.row', { n: index + 1 }) } }, [
          el('div', { class: 'cells' }, [
            ...MAIN.map((column) => input(record, column)),
            el('button', {
              class: 'button is-small', text: '✕',
              attrs: { type: 'button', title: t('manual.remove'), 'aria-label': t('manual.remove') },
              on: { click: () => { rows.splice(index, 1); draw(); emit(); } },
            }),
          ]),
          el('details', {}, [
            el('summary', { text: t('manual.more') }),
            el('div', { class: 'cells' }, MORE.map((column) => input(record, column))),
            portions,
            el('button', {
              class: 'button is-small', text: t('manual.split.add'),
              attrs: { type: 'button' },
              on: { click: () => { parts.push({ dest: '' }); drawPortions(); } },
            }),
          ]),
        ]),
      );
    });
    root.append(
      el('div', { class: 'services-actions' }, [
        el('button', { class: 'button', text: t('manual.add'), attrs: { type: 'button' }, on: { click: () => { rows.push({ dest: '', min: 5 }); draw(); emit(); } } }),
        el('button', {
          class: 'button', text: t('manual.example'), attrs: { type: 'button' },
          on: { click: () => { rows.splice(0, rows.length, ...EXAMPLE_ROWS.map((row) => ({ ...row }))); draw(); emit(); } },
        }),
      ]),
    );
  };
  draw();
  return root;
}
