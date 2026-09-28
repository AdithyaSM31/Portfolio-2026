import { links, featured, archive, experience, skills, marquee, education, certs } from './data.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n) => String(n).padStart(2, '0');
const $ = (sel) => document.querySelector(sel);

// Numbers like "5", "15+", "150+" get emphasised inside experience bullets
const emphasiseNumbers = (s) => esc(s).replace(/(\d+\+?)/g, '<b>$1</b>');

// Shared by the archive accordion and the desktop hover card
export function archiveDetails(p) {
  const links = p.links.length
    ? p.links
        .map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} <span aria-hidden="true">↗</span></a>`)
        .join('')
    : '<span class="adet__none mono">Hardware build · no public repo</span>';
  return `
    <p class="adet__d">${esc(p.long)}</p>
    <ul class="adet__stack">${p.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="adet__links">${links}</div>`;
}

export function renderContent() {
  // Links
  const hrefs = {
    email: `mailto:${links.email}`,
    phone: `tel:${links.phone.replace(/\s/g, '')}`,
    github: links.github,
    linkedin: links.linkedin,
    resume: links.resume,
  };
  document.querySelectorAll('[data-link]').forEach((a) => {
    const key = a.dataset.link;
    a.href = hrefs[key];
    if (!a.textContent.trim()) a.textContent = key === 'email' ? links.email : key === 'phone' ? links.phone : a.textContent;
  });
  const mail = $('[data-email-text]');
  if (mail) mail.textContent = links.email;

  // Hero ticker (duplicated for a seamless loop)
  const tick = $('[data-marquee-hero]');
  if (tick) {
    const row = marquee.map((m) => `<span>${esc(m)}</span>`).join('');
    tick.innerHTML = row + row;
  }

  // Featured stacked cards
  const fc = $('[data-featured]');
  if (fc) {
    fc.innerHTML = featured
      .map((p, i) => {
        const photo = p.id === 'drone';
        return `
      <article class="scard">
        <div class="scard__inner">
          <div class="scard__info">
            <div class="scard__top mono"><b>${pad(i + 1)}</b><span>${esc(p.category)}</span></div>
            <h3 class="scard__title">${esc(p.title)}</h3>
            <p class="scard__kicker">${esc(p.kicker)}</p>
            <p class="scard__blurb">${esc(p.blurb)}</p>
            <dl class="scard__specs">
              ${p.specs.map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
            </dl>
            <div class="scard__links">
              ${p.links
                .map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} <span aria-hidden="true">↗</span></a>`)
                .join('')}
            </div>
          </div>
          <a class="scard__media" href="${esc(p.links[0][1])}" target="_blank" rel="noopener" aria-label="Open ${esc(p.title)}" data-cursor="${p.links[0][0] === 'Live' ? 'Visit' : 'Code'}">
            <div class="scard__frame${photo ? ' is-photo' : ''}">
              <div class="scard__glow" style="background-image:url('${p.img.replace('.webp', '-sm.webp')}')"></div>
              <img src="${p.img}" alt="${esc(p.title)} — ${esc(p.kicker)}" loading="lazy" decoding="async" />
            </div>
          </a>
          <div class="scard__shade"></div>
        </div>
      </article>`;
      })
      .join('');
  }

  // Archive list: each row carries an expandable details panel (used as an
  // accordion on touch and keyboard; desktop hover shows the same details in a card)
  const al = $('[data-archive]');
  if (al) {
    al.innerHTML = archive
      .map(
        (p, i) => `
      <li class="arow" data-i="${i}">
        <div class="arow__row" tabindex="0" role="button" aria-expanded="false" aria-controls="arow-${i}">
          <img class="arow__thumb" src="${p.img}" alt="" loading="lazy" />
          <span class="arow__i mono">${pad(i + 7)}</span>
          <span class="arow__t">${esc(p.title)}</span>
          <span class="arow__d">${esc(p.desc)}</span>
          <span class="arow__g mono">${esc(p.tags)}</span>
          <span class="arow__a" aria-hidden="true">+</span>
        </div>
        <div class="arow__more" id="arow-${i}"><div class="arow__inner">${archiveDetails(p)}</div></div>
      </li>`
      )
      .join('');
  }

  // Experience wheel + panels
  const wheel = $('[data-wheel]');
  const panels = $('[data-exp-panels]');
  if (wheel && panels) {
    wheel.innerHTML = experience
      .map((e, i) => `<button class="wheel__item" data-i="${i}" aria-label="${esc(e.role)} at ${esc(e.full)}">${esc(e.org)}</button>`)
      .join('');
    panels.innerHTML = experience
      .map(
        (e) => `
      <article class="xpanel">
        <span class="xpanel__date mono">${esc(e.date)}</span>
        <h3 class="xpanel__role">${esc(e.role)}</h3>
        <p class="xpanel__org">${esc(e.full)}<span>${esc(e.place)}</span></p>
        <ul>${e.points.map((pt) => `<li>${emphasiseNumbers(pt)}</li>`).join('')}</ul>
      </article>`
      )
      .join('');
    const total = $('[data-exp-total]');
    if (total) total.textContent = pad(experience.length);
  }

  // Big marquee rows
  document.querySelectorAll('[data-bigmarquee]').forEach((row, r) => {
    const words = r === 0 ? ['Machine learning', 'Full-stack', 'Robotics', 'Cloud', 'Computer vision'] : ['Real-time systems', 'LLM apps', 'Embedded', 'DevOps', 'Data science'];
    const html = words.map((w) => `<span>${esc(w)}</span>`).join('');
    row.innerHTML = html + html + html;
  });

  // Skills grid
  const sk = $('[data-skills]');
  if (sk) {
    sk.innerHTML = skills
      .map(
        (g) => `
      <div class="skills__col">
        <h4 class="mono">${esc(g.group)} <span>(${pad(g.items.length)})</span></h4>
        <ul>${g.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
      </div>`
      )
      .join('');
  }

  // Education
  const ed = $('[data-edu]');
  if (ed) {
    ed.innerHTML = education
      .map(
        (e) => `
      <div class="edu__row" data-reveal>
        <span class="edu__year mono">${esc(e.year)}</span>
        <span class="edu__school">${esc(e.school)}</span>
        <span class="edu__deg">${esc(e.degree)}</span>
        <span class="edu__score">${esc(e.score)}</span>
      </div>`
      )
      .join('');
  }

  // Certifications
  const cl = $('[data-certs]');
  if (cl) {
    cl.innerHTML = certs
      .map(
        (c) => `
      <li class="cert${c.star ? ' is-star' : ''}" data-reveal>
        <span class="cert__name"><i></i>${esc(c.name)}</span>
        <span class="cert__by">${esc(c.by)}</span>
        <span class="cert__date mono">${esc(c.date || '—')}</span>
      </li>`
      )
      .join('');
  }
}
