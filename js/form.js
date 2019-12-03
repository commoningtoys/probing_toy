const panels_container = document.querySelector('.panels-container');
const panels = document.getElementsByClassName('panel');
const panel_width = panels[2].getBoundingClientRect().width;

let scroller
const next = (el) => {
  const next_panel = parseInt(el.dataset.panel);
  const start = ((next_panel - 1) * panel_width) + (40 * (next_panel - 1));
  const end = (next_panel * panel_width) + (40 * next_panel);
  let x = start;
  scroller = setInterval(() => {
    x += 10;
    panels_container.scrollTo(x, 0);
    if (x > end) {
      clearInterval(scroller);
    }
  }, 0.1);
}
let model_config = communities_configs[0];
const communities_panel = document.getElementById('communities')
const btns = document.createElement('div');
btns.setAttribute('class', 'btns');
for (const config of communities_configs) {
  const btn = document.createElement('div');
  btn.setAttribute('class', 'btn box');
  btn.setAttribute('data-panel', '2');
  btn.textContent = config.name;
  btn.onclick = (el) => {
    /// we go to the next page of the menu
    const siblings = el.target.parentElement.children;
    for (const kid of siblings) {
      kid.setAttribute('class', 'btn box');
    }
    el.target.setAttribute('class', 'btn box selected')
    model_config = communities_configs.filter(result => result.name === config.name)[0];
    next(btn);
  }
  btns.appendChild(btn);
}
communities_panel.appendChild(btns);