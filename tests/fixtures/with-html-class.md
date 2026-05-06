# Page With HTML Classes

Plain anchor with class:

<a href="/discover" class="button primary">Discover eUSD</a>

Multi-attribute div:

<div class="grid two-cols" id="features" data-foo="bar">
  Some content.
</div>

Already-converted JSX (must NOT be re-mangled):

<a href="/x" className="link">already JSX</a>

No class at all:

<span id="just-id">no class here</span>

Prose mentioning the word class: a class of objects, the class hierarchy.

Inline `class` in code:

```html
<div class="raw">code stays as-is ideally</div>
```

Void element img not self-closed:

<figure><img src="/images/abc.png" alt="diagram"><figcaption>caption</figcaption></figure>

Void element br:

Line one<br>
line two.

Already self-closed img (must NOT be doubled):

<img src="/x.png" alt="ok" />
