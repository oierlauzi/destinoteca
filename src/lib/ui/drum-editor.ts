import { t } from '../../i18n';
import { toDom } from '../hardware';
import type { Values } from '../params';
import { DEFAULT_PRESET, flapsOfPreset, offered, parseFlap, PRESETS } from '../replicas/solari-renfe/drum';
import { identitiesOf } from '../replicas/solari-renfe/logos';
import { cardPreview } from '../replicas/solari-renfe/render';
import { el } from './dom';

/**
 * The editor of a Solari board's drum: the cards printed for the train
 * column, in the order they fall.
 *
 * A drum is hardware, so this is the list of cards a board carries and not a
 * filter over what it may show. Each card is drawn as it falls on the board,
 * because the cards are pictures and a list of names would not say which
 * identity is which.
 *
 * The drums offered are loaded, not followed: loading one throws away
 * whatever the list holds and fills it afresh, so a board is built by loading
 * the nearest drum and then changing it. While nothing has been changed the
 * list is the loaded drum itself, and the URL carries its name instead of
 * every card.
 */

/**
 * What a card is called in the list. The identity comes after the product
 * only where it tells the cards apart: a product printed in one identity has
 * nothing to choose between, and naming it there says nothing.
 */
const name = (key: string): string => {
  const flap = parseFlap(key);
  if (flap.identity === 'rotulado' || identitiesOf(flap.text).length < 2) return flap.text;
  return `${flap.text} · ${t(`solari.identity.${flap.identity}`)}`;
};

/** The card as it falls on the board, at the width of the column it belongs to. */
const preview = (key: string): HTMLElement =>
  el('span', { class: 'drum-card-art', attrs: { 'aria-hidden': 'true' } }, [toDom(cardPreview(key), document)]);

export function drumEditor(value: unknown, onChange: (value: unknown, also?: Values) => void, siblings: Values): HTMLElement {
  // The long-distance board is the only one with a drum of plates.
  let loaded = String(siblings?.drum ?? DEFAULT_PRESET);
  const own: string[] = Array.isArray(value) ? value.map(String) : [];
  let cards = own.length ? [...own] : flapsOfPreset(loaded, 'largo');
  // The form keeps this editor alive across changes, so what the list holds is
  // remembered here rather than read back from the value.
  let edited = own.length > 0;
  let open = false;
  const root = el('div', { class: 'drum-editor' });

  const emit = (): void => {
    edited = true;
    onChange([...cards]);
  };

  /** Loading a drum clears the list and fills it with that drum's cards. */
  const load = (id: string): void => {
    loaded = id;
    cards = flapsOfPreset(id, 'largo');
    edited = false;
    onChange([], { drum: id });
    draw();
  };

  const move = (from: number, to: number): void => {
    cards.splice(to, 0, ...cards.splice(from, 1));
    emit();
    draw();
  };

  const button = (text: string, title: string, card: string, enabled: boolean, click: () => void): HTMLElement =>
    el('button', { text, attrs: { type: 'button', title, 'aria-label': `${title}: ${name(card)}`, disabled: !enabled }, on: { click } });

  const draw = (): void => {
    const list = el(
      'ol',
      { class: 'drum-cards' },
      cards.map((card, index) =>
        el('li', { class: 'drum-card' }, [
          preview(card),
          el('span', { class: 'drum-card-name', text: name(card) }),
          button('↑', t('solari.drum.up'), card, index > 0, () => move(index, index - 1)),
          button('↓', t('solari.drum.down'), card, index < cards.length - 1, () => move(index, index + 1)),
          button('×', t('solari.drum.remove'), card, true, () => {
            cards.splice(index, 1);
            emit();
            draw();
          }),
        ]),
      ),
    );

    // Only cards the drum does not already carry: a board has one of each.
    const rest = offered('largo').filter((card) => !cards.includes(card));
    const picker = el('select', { attrs: { 'aria-label': t('solari.drum.add') } }, [
      el('option', { text: t('solari.drum.add'), attrs: { value: '' } }),
      ...rest.map((card) => el('option', { text: name(card), attrs: { value: card } })),
    ]);
    picker.addEventListener('change', () => {
      if (!picker.value) return;
      cards.push(picker.value);
      emit();
      draw();
    });

    const details = el('details', { class: 'drum-list', attrs: { open } }, [
      el('summary', {}, [el('span', { text: t('solari.drum.cards') }), el('span', { class: 'drum-count', text: String(cards.length) })]),
      list,
      el('div', { class: 'drum-add' }, [picker]),
    ]);
    details.addEventListener('toggle', () => (open = details.open));

    root.replaceChildren(
      // Outside the list, because loading one replaces everything in it.
      el('div', { class: 'drum-presets' }, [
        el('span', { class: 'drum-presets-label', text: t('solari.drum.load') }),
        ...PRESETS.map((preset) =>
          el('button', {
            class: 'drum-preset',
            text: t(`solari.drum.${preset.id}`),
            attrs: { type: 'button', 'aria-pressed': String(!edited && preset.id === loaded) },
            on: { click: () => load(preset.id) },
          }),
        ),
      ]),
      el('p', { class: 'drum-note', text: edited ? t('solari.drum.own') : t(`solari.drum.${loaded}.note`) }),
      details,
    );
  };

  draw();
  return root;
}
