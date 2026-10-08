/**
 * <club-rating value="3" [readonly]> : a 1-5 star widget in a Shadow DOM.
 * Click a star to set the value; it fires a composed `rating-change` event with the number in `detail`.
 */
class ClubRating extends HTMLElement {
  static observedAttributes = ['value', 'readonly']
  private root = this.attachShadow({ mode: 'open' })

  get value() {
    return Number(this.getAttribute('value')) || 0
  }
  set value(v: number) {
    this.setAttribute('value', String(v))
  }
  get readOnly() {
    return this.hasAttribute('readonly')
  }

  connectedCallback() {
    this.render()
  }
  attributeChangedCallback() {
    this.render()
  }

  private render() {
    const value = this.value
    const stars = [1, 2, 3, 4, 5]
      .map(
        (n) =>
          `<button type="button" data-v="${n}" aria-label="${n} star${n > 1 ? 's' : ''}" aria-pressed="${n <= value}" ${this.readOnly ? 'disabled' : ''} class="${n <= value ? 'on' : ''}">★</button>`,
      )
      .join('')
    this.root.innerHTML = `
      <style>
        :host { display: inline-block; }
        button { all: unset; font-size: 1.5rem; line-height: 1; color: #cbd5e1; padding: 0 2px; cursor: pointer; }
        button.on { color: #f59e0b; }
        button:focus-visible { outline: 2px solid #2563eb; border-radius: 4px; }
        button:disabled { cursor: default; font-size: 1rem; }
      </style>
      <div role="group" aria-label="Rating: ${value} of 5">${stars}</div>`
    this.root.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        this.value = Number(b.dataset.v)
        this.dispatchEvent(new CustomEvent('rating-change', { detail: this.value, bubbles: true, composed: true }))
      }),
    )
  }
}

if (!customElements.get('club-rating')) customElements.define('club-rating', ClubRating)

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'club-rating': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: number
        readonly?: boolean
      }
    }
  }
}

export {}
