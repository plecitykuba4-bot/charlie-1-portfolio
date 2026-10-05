/* Nadpis se drží u hlavy.
 *
 * Nadpis škáluje se šířkou okna, portrét s jeho výškou, takže na širokém
 * monitoru se oba rozejdou a mezi posledním písmenem a hlavou zůstane
 * oranžová díra. Proto se velikost nadpisu dopočítá z toho, kde postava
 * v jeho výšce opravdu začíná.
 *
 * SILUETA je levý okraj neprůhledné části portrétu po jednom procentu
 * jeho výšky (podíl šířky snímku), odečtený z hero-charlie.png.
 */
const SILUETA = [
  0.4302, 0.3928, 0.3669, 0.3252, 0.2993, 0.282, 0.2604, 0.2475, 0.2403,
  0.2302, 0.2173, 0.2029, 0.1899, 0.1784, 0.1712, 0.1655, 0.1597, 0.1554,
  0.1525, 0.1511, 0.1511, 0.1511, 0.1525, 0.154, 0.1583, 0.1612, 0.164,
  0.1698, 0.1755, 0.1755, 0.1827, 0.1928, 0.1971, 0.2029, 0.2158, 0.2187,
  0.2216, 0.2273, 0.2245, 0.2245, 0.2201, 0.2173, 0.2129, 0.2101, 0.2086,
  0.2043, 0.2014, 0.2014, 0.2014, 0.1986, 0.1928, 0.1899, 0.1914, 0.2489,
  0.2388, 0.2331, 0.2317, 0.2288, 0.2245, 0.2187, 0.2144, 0.2058, 0.1971,
  0.1971, 0.2043, 0.2101, 0.1914, 0.1741, 0.1554, 0.1353, 0.1194, 0.1022,
  0.0964, 0.1022, 0.0935, 0.0345, 0.0216, 0.0173, 0.0173, 0.0173, 0.0058,
  0.0058, 0.0086, 0.0187, 0.0158, 0.0043, 0.0043, 0.0043, 0.0043, 0.0043,
  0.0043, 0.0043, 0.0043, 0.0043, 0.0043, 0.0043, 0.0043, 0.0043, 0.0043,
  0.0043, 0.0072,
];

/* O kolik smí nadpis zajet za obrys — v předloze poslední písmeno mizí
   jen špičkou — písmeno musí zůstat čitelné. Podíl šířky nadpisu. */
const PREKRYV = 0.055;

const hero = document.querySelector('.hero');
const title = document.querySelector('.hero__title');
const portret = document.querySelector('.hero__portrait');

function obrysVPasu(portretRect, odY, doY) {
  // Nejmenší (nejlevější) okraj siluety v pásu, který nadpis zabírá.
  const vyska = portretRect.height;
  let min = 1;
  for (let i = 0; i < SILUETA.length; i++) {
    const y = portretRect.top + (vyska * i) / SILUETA.length;
    if (y < odY - vyska / SILUETA.length || y > doY) continue;
    if (SILUETA[i] < min) min = SILUETA[i];
  }
  return min;
}

function dolad() {
  if (!hero || !title || !portret || !portret.complete) return;

  title.style.fontSize = '';
  // Na mobilu stojí nadpis nad portrétem, takže se k hlavě nedolaďuje.
  if (matchMedia('(max-width: 900px)').matches) return;
  const t = title.getBoundingClientRect();
  const p = portret.getBoundingClientRect();
  if (!t.width || !p.width) return;

  const podil = obrysVPasu(p, t.top, t.bottom);
  const hlavaX = p.left + p.width * podil;
  const cil = hlavaX - t.left + t.width * PREKRYV;
  if (cil <= 0) return;

  const zaklad = parseFloat(getComputedStyle(title).fontSize);
  const nova = zaklad * (cil / t.width);
  // Meze, ať nadpis nepřeroste desku ani nezmizí.
  const strop = hero.clientHeight * 0.50;
  title.style.fontSize = Math.max(40, Math.min(nova, strop)) + 'px';
}

if (portret) {
  if (portret.complete) dolad();
  else portret.addEventListener('load', dolad);
  document.fonts?.ready.then(dolad);
  addEventListener('resize', dolad);
}

/* Sekce a jejich bloky najíždějí, jakmile se dostanou do zorného pole.
 *
 * Záměrně bez IntersectionObserver: kdyby z jakéhokoli důvodu nevystřelil,
 * zůstal by celý obsah pod herem neviditelný. Tohle počítá polohu samo
 * a navíc má pojistku, která po chvíli odkryje všechno.
 */
const najizdi = [...document.querySelectorAll(
  '.sekce__hlava, .obory li, .osa li, .blok, .schema__sloupec li, .formular'
)];

/* Nadpisy se neodkrývají posunem, ale odhrnutím masky zleva doprava. */
const odhrnout = [...document.querySelectorAll('.sekce__nadpis')];

if (najizdi.length || odhrnout.length) {
  najizdi.forEach((el) => el.classList.add('najede'));
  odhrnout.forEach((el) => el.classList.add('odhrne'));

  /* Sousedi ve stejné skupině nastupují po sobě, ne naráz. */
  const skupiny = new Map();
  najizdi.forEach((el) => {
    const rodic = el.parentElement;
    const rada = skupiny.get(rodic) || [];
    rada.push(el);
    skupiny.set(rodic, rada);
  });
  skupiny.forEach((rada) => {
    if (rada.length < 2) return;
    rada.forEach((el, i) => {
      el.style.setProperty('--nastup', (i * 80) + 'ms');
    });
  });

  const vse = [...najizdi, ...odhrnout];

  let ceka = false;
  const odkryj = () => {
    ceka = false;
    const mez = innerHeight * 0.88;
    vse.forEach((el) => {
      if (el.classList.contains('je-videt')) return;
      if (el.getBoundingClientRect().top < mez) el.classList.add('je-videt');
    });
  };
  const naplanuj = () => {
    if (ceka) return;
    ceka = true;
    requestAnimationFrame(odkryj);
  };

  addEventListener('scroll', naplanuj, { passive: true });
  addEventListener('resize', naplanuj);
  naplanuj();

  // Pojistka: kdyby výpočet selhal a neodkryl ani první blok, odkryjeme
  // po dvou vteřinách všechno — prázdná stránka je horší než chybějící efekt.
  setTimeout(() => {
    if (document.querySelector('.je-videt')) return;
    vse.forEach((el) => el.classList.add('je-videt'));
  }, 2000);
}

/* Navigace se označí, jakmile hero odjede z dohledu. */
const nav = document.querySelector('.nav');
if (nav && hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(
    ([entry]) => nav.classList.toggle('nav--past', !entry.isIntersecting),
    { rootMargin: '-60px 0px 0px 0px' }
  ).observe(hero);
}


/* Pomocné dotazy na prostředí ------------------------------------------ */
const jemnyPohyb = matchMedia('(prefers-reduced-motion: reduce)');

/* Hloubka v heru -------------------------------------------------------
 *
 * Portrét se při scrollu posouvá pomaleji než text, takže hero získá
 * hloubku. Posun je jen transform a počítá se v už existujícím rAF cyklu.
 */
if (!jemnyPohyb.matches && portret && hero) {
  let planuje = false;

  const hloubka = () => {
    planuje = false;
    const posun = scrollY;
    if (posun > hero.offsetHeight) return;
    portret.style.setProperty('--hloubka', (posun * 0.14).toFixed(1) + 'px');
  };

  addEventListener('scroll', () => {
    if (planuje) return;
    planuje = true;
    requestAnimationFrame(hloubka);
  }, { passive: true });

  hloubka();
}


/* Odeslání formuláře ---------------------------------------------------
 *
 * Formulář odchází na pozadí, takže se neotevírá poštovní klient a
 * návštěvník neopustí stránku. Tlačítko mezitím prochází stavy
 * Odeslat → Odesílám → Odesláno.
 *
 * Bez vyplněného access_key se odesílat nedá; v tom případě to řekneme
 * rovnou místo abychom předstírali, že zpráva odešla.
 */
const formular = document.querySelector('.formular');
const hlaska = document.querySelector('.hlaska');

if (formular && hlaska) {
  const tlacitko = formular.querySelector('button[type="submit"]');
  const popisek = tlacitko.querySelector('span');
  const klid = popisek.dataset.klid || popisek.textContent;

  const stav = (text, trida) => {
    hlaska.textContent = text;
    hlaska.className = 'hlaska' + (trida ? ' hlaska--' + trida : '');
  };

  formular.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!formular.reportValidity()) return;

    const data = new FormData(formular);
    if (!data.get('access_key')) {
      stav('Formulář zatím není napojený. Napište mi prosím na drexleroutreach@gmail.com.', 'chyba');
      return;
    }

    tlacitko.disabled = true;
    tlacitko.classList.add('btn--pracuje');
    popisek.textContent = 'Odesílám';
    stav('');

    try {
      const odpoved = await fetch(formular.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      const vysledek = await odpoved.json().catch(() => ({}));

      if (odpoved.ok && vysledek.success !== false) {
        tlacitko.classList.remove('btn--pracuje');
        tlacitko.classList.add('btn--hotovo');
        popisek.textContent = 'Odesláno';
        stav('Díky, ozvu se do dvou dnů.', 'ok');
        formular.reset();
        setTimeout(() => {
          tlacitko.classList.remove('btn--hotovo');
          popisek.textContent = klid;
          tlacitko.disabled = false;
        }, 2600);
      } else {
        throw new Error(vysledek.message || 'odeslání selhalo');
      }
    } catch (chyba) {
      tlacitko.classList.remove('btn--pracuje');
      popisek.textContent = klid;
      tlacitko.disabled = false;
      stav('Nepodařilo se odeslat. Zkuste to znovu, nebo napište na drexleroutreach@gmail.com.', 'chyba');
    }
  });
}


/* Lightbox --------------------------------------------------------------
 *
 * Každý blok s data-galerie je jedna galerie. Šipky a klávesy listují
 * jen v ní, na dotyku se dá táhnout prstem.
 */
const lightbox = document.querySelector('.lightbox');
const galerie = new Map();

if (lightbox && typeof lightbox.showModal === 'function') {
  const obraz = lightbox.querySelector('.lightbox__obraz');
  // Obrázek vzniká až tady: v HTML by bez src visel rozbitý.
  const img = document.createElement('img');
  obraz.prepend(img);
  const popis = obraz.querySelector('figcaption');
  const pocet = lightbox.querySelector('.lightbox__pocet');
  let aktivni = [];
  let index = 0;

  const ukaz = (i, animuj = true) => {
    index = (i + aktivni.length) % aktivni.length;
    const zdroj = aktivni[index];
    img.src = zdroj.src;
    img.alt = zdroj.alt;
    popis.textContent = zdroj.alt;
    pocet.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(aktivni.length).padStart(2, '0');
    if (animuj) {
      obraz.classList.remove('meni');
      void obraz.offsetWidth;
      obraz.classList.add('meni');
    }
  };

  window.otevriGalerii = (blok, i) => {
    aktivni = galerie.get(blok) || [];
    if (!aktivni.length) return;
    lightbox.classList.toggle('lightbox--sam', aktivni.length < 2);
    ukaz(i, false);
    lightbox.showModal();
  };

  document.querySelectorAll('[data-galerie]').forEach((blok) => {
    const obrazky = [...blok.querySelectorAll('figure img')];
    galerie.set(blok, obrazky.map((i) => ({ src: i.currentSrc || i.src, alt: i.alt })));
    obrazky.forEach((i, n) => i.addEventListener('click', () => window.otevriGalerii(blok, n)));
  });

  lightbox.querySelector('.lightbox__zavrit').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lightbox__sipka--zpet').addEventListener('click', () => ukaz(index - 1));
  lightbox.querySelector('.lightbox__sipka--dal').addEventListener('click', () => ukaz(index + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') ukaz(index - 1);
    if (e.key === 'ArrowRight') ukaz(index + 1);
  });
  lightbox.addEventListener('close', () => { img.removeAttribute('src'); });

  let dotyk = null;
  lightbox.addEventListener('touchstart', (e) => { dotyk = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (dotyk === null) return;
    const dx = e.changedTouches[0].clientX - dotyk;
    if (Math.abs(dx) > 50) ukaz(index + (dx < 0 ? 1 : -1));
    dotyk = null;
  });
}


/* Šipky u průvodu -------------------------------------------------------
 *
 * Posunou carousel o dva snímky. Na krajích zešednou, ať je jasné, že
 * dál už nic není.
 */
document.querySelectorAll('.blok__hlava--sipky').forEach((hlava) => {
  const pruvod = hlava.parentElement.querySelector('.pruvod');
  const tlacitka = [...hlava.querySelectorAll('.pruvod__sipka')];
  if (!pruvod) return;
  const krok = () => {
    const f = pruvod.querySelector('figure');
    return f ? (f.offsetWidth + parseFloat(getComputedStyle(pruvod).columnGap || 16)) * 2 : 300;
  };
  const stav = () => {
    const konec = pruvod.scrollWidth - pruvod.clientWidth - 2;
    tlacitka[0].disabled = pruvod.scrollLeft <= 2;
    tlacitka[1].disabled = pruvod.scrollLeft >= konec;
  };
  tlacitka.forEach((b) => b.addEventListener('click', () => {
    pruvod.scrollBy({ left: Number(b.dataset.smer) * krok(), behavior: jemnyPohyb.matches ? 'auto' : 'smooth' });
  }));
  pruvod.addEventListener('scroll', stav, { passive: true });
  addEventListener('resize', stav);
  stav();
});
