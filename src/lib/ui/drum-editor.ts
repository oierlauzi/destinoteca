import { t } from '../../i18n';
import type { Values } from '../params';
import { DEFAULT_PRESET, flapsOfPreset, offered, parseFlap, textOf } from '../replicas/solari-renfe/drum';
import { el } from './dom';

/**
 * The editor of a Solari board's drum: the cards printed for the train
 * column, in the order they fall.
 *
 * A drum is hardware, so this is a list of the cards a board carries and not
 * a filter over what it may show. While the list is empty the board follows
 * the preset chosen beside it; the first change writes the preset's cards out
 * and the list takes over, which is what the «parte de» button says.
 */

const label = (key: string): string => {
  const flap = parseFlap(key);
  return flap.identity === 'rotulado' ? flap.text : `${flap.text} · ${t(`solari.identity.${flap.identity}`)}`;
};

export function drumEditor(value: unknown, onChange: (value: unknown) => void, siblings: Values): HTMLElement {
  // The long-distance board is the only one with a drum of plates.
  const preset = String(siblings?.drum ?? DEFAULT_PRESET);
  const own: string[] = Array.isArray(value) ? value.map(String) : [];
  let cards = own.length ? [...own] : flapsOfPreset(preset, 'largo');
  // The form keeps this editor alive across changes, so whether the drum is
  // the preset's is remembered here and not read back from the value.
  let edited = own.length > 0;
  const root = el('div', { class: 'drum-editor' });
  const emit = (): void => {
    edited = true;
    onChange([...cards]);
  };

  const draw = (): void => {
    const following = !edited;
    const list = el(
      'ol',
      { class: 'drum-cards' },
      cards.map((card, index) =>
        el('li', { class: 'drum-card' }, [
          el('span', { class: 'drum-card-name', text: label(card) }),
          el('button', {
            text: '↑',
            attrs: { type: 'button', title: t('solari.drum.up'), 'aria-label': `${t('solari.drum.up')}: ${label(card)}`, disabled: index === 0 },
            on: {
              click: () => {
                cards.splice(index - 1, 0, ...cards.splice(index, 1));
                emit();
                draw();
              },
            },
          }),
          el('button', {
            text: '↓',
            attrs: { type: 'button', title: t('solari.drum.down'), 'aria-label': `${t('solari.drum.down')}: ${label(card)}`, disabled: index === cards.length - 1 },
            on: {
              click: () => {
                cards.splice(index + 1, 0, ...cards.splice(index, 1));
                emit();
                draw();
              },
            },
          }),
          el('button', {
            text: '×',
            attrs: { type: 'button', title: t('solari.drum.remove'), 'aria-label': `${t('solari.drum.remove')}: ${label(card)}` },
            on: {
              click: () => {
                cards.splice(index, 1);
                emit();
                draw();
              },
            },
          }),
        ]),
      ),
    );

    // Only cards the drum does not already carry: a board has one of each.
    const rest = offered('largo').filter((card) => !cards.includes(card));
    const picker = el(
      'select',
      { attrs: { 'aria-label': t('solari.drum.add') } },
      [el('option', { text: t('solari.drum.add'), attrs: { value: '' } }), ...rest.map((card) => el('option', { text: label(card), attrs: { value: card } }))],
    );
    picker.addEventListener('change', () => {
      if (!picker.value) return;
      cards.push(picker.value);
      emit();
      draw();
    });

    root.replaceChildren(
      el('p', { class: 'drum-note', text: following ? t('solari.drum.following') : t('solari.drum.own') }),
      list,
      el('div', { class: 'drum-add' }, [picker]),
      ...(edited
        ? [
            el('button', {
              class: 'drum-reset',
              text: t('solari.drum.reset'),
              attrs: { type: 'button' },
              on: {
                click: () => {
                  cards = flapsOfPreset(preset, 'largo');
                  edited = false;
                  onChange([]);
                  draw();
                },
              },
            }),
          ]
        : []),
    );
  };

  draw();
  return root;
}

/** What a drum says, for a summary beside the board. */
export const drumSummary = (cards: string[]): string => cards.map(textOf).join(' · ');
