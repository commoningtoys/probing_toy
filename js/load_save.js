new ClipboardJS('.copy');// to save to clipboard


let storage_available = false;

if (storageAvailable('localStorage')) {
  storage_available = true;
}
else {
  // Too bad, no localStorage for us
  console.log("local storage not available, save and load functions won't work on this browser");
}

const traits_id = [
  'trait-0',
  'trait-1',
  'trait-2',
  'trait-3'
];



// let config = {
//   agents: [],
//   model: {
//     task_sets: parseInt(document.getElementById('how-many-task').value),
//     model_type: get_model_type(),
//     hours: parseInt(document.getElementById('monthly-hours').value),
//     wage: parseInt(document.getElementById('min-wage').value),
//     stress_inc: parseFloat(document.getElementById('stress-increment').value),
//     stress_dec: parseFloat(document.getElementById('stress-decrement').value),
//     stop_after: parseInt(document.getElementById('stop-model').value)
//   }
// }



function update_config() {
  // here we need to extract the values of the menu
  config.agents = [];
  let index = 0;
  for (const id of traits_id) {
    const elt = document.getElementById(id);
    // here we extract the values we neeed
    const amount = parseInt(elt.children['amount'].value);
    const trait = elt.children['trait'].value; // this must stay a string
    const curiosity = parseFloat(elt.children['curiosity'].value);
    const perfectionism = parseFloat(elt.children['perfectionism'].value);
    const endurance = parseFloat(elt.children['endurance'].value);
    const goodwill = parseFloat(elt.children['goodwill'].value);
    const planning = get_values_hidden_menu(index);
    // and we push them inside the array
    config.agents.push({
      id, amount, trait, curiosity, perfectionism, endurance, goodwill, planning
    });
    index++;
  }

  config.model = {
    task_sets: parseInt(document.getElementById('how-many-task').value),
    model_type: get_model_type(),
    hours: parseInt(document.getElementById('monthly-hours').value),
    wage: parseInt(document.getElementById('min-wage').value),
    stress_inc: parseFloat(document.getElementById('stress-increment').value),
    stress_dec: parseFloat(document.getElementById('stress-decrement').value),
    stop_after: parseInt(document.getElementById('stop-model').value)
  }

  set_config_to_html();
}

update_config();

function set_config_to_html() {
  const el = document.getElementById('show-config');
  el.innerHTML = '';
  for (const conf of config.agents) {
    const str = `${conf.trait}: 👫🏻 – ${conf.amount} | 🔎 – ${conf.curiosity} | 🔭 – ${conf.perfectionism} | 🚴🏻 – ${conf.endurance} | 🛠 – ${conf.goodwill} | 🗓 – ${conf.planning[0]}`
    const tmp_div = document.createElement('div');
    tmp_div.setAttribute('class', 'caption-config');
    tmp_div.textContent = str;
    el.appendChild(tmp_div);
  }
  const str = `task-sets – ${config.model.task_sets} | model type – ${config.model.model_type} | hours – ${config.model.hours} | wage – ${config.model.wage} | stress increment – ${config.model.stress_inc} | stress decrement – ${config.model.stress_dec} | end after – ${config.model.stop_after}`
  const tmp_div = document.createElement('div');
  tmp_div.setAttribute('class', 'caption-config');
  tmp_div.textContent = str;
  el.appendChild(tmp_div);
}

// attach event listener to the input values so that the config is always updated
const inputs = document.querySelectorAll('.traits-input input');
for (const input of inputs) {
  input.addEventListener('change', () => {
    if (input.type === 'number') input.value = get_decimal_value(input.value);
    update_buttons();
    update_config();
  });
}

function save_traits() {
  const elt = document.getElementById('save-config')
  const config_name = elt.value;

  update_config();

  if (check_cookie(config_name)) {
    set_cookie(config_name, config);

    const select = document.getElementById('load-config');
    const option = document.createElement('option');
    option.setAttribute('class', 'btn')
    option.value = config_name;
    option.textContent = config_name;
    select.appendChild(option);
  } else {
    elt.value = 'choose another name!'
  }

}

function load_traits(elt) {
  const val = elt.selectedOptions[0].value;
  const cookie = atob(get_cookie(val));
  config = JSON.parse(cookie);
  for (const item of config.agents) {
    const elt = document.getElementById(item.id);
    elt.children['amount'].value = item.amount;
    elt.children['trait'].value = item.trait; // this must stay a string
    elt.children['curiosity'].value = item.curiosity;
    elt.children['perfectionism'].value = item.perfectionism;
    elt.children['endurance'].value = item.endurance;
    elt.children['goodwill'].value = item.goodwill;

    const inputs = elt.lastElementChild.children;
    for (const input of inputs) {
      for (const plan of item.planning) {
        if (input.value && input.value === plan) {
          input.checked = true;
        }
      }
    }
  }
  document.getElementById('how-many-task').value = config.model.task_sets;

  const model_type_inputs = document.querySelectorAll('#model-type input')
  for (const input of model_type_inputs) {
    if (input.value === config.model.model_type) input.checked = true;
  }
  document.getElementById('monthly-hours').value = config.model.hours;
  document.getElementById('min-wage').value = config.model.wage;
  document.getElementById('stress-increment').value = config.model.stress_inc;
  document.getElementById('stress-decrement').value = config.model.stress_dec;
  document.getElementById('stop-model').value = config.model.stop_after;

  update_buttons();
  set_config_to_html();
}


function set_config_names() {
  const select = document.getElementById('load-config');
  const cookies = get_all_cookie_names();
  for (let i = 0; i < cookies.length; i++) {
    const name = cookies[i];
    if(name === '')break;
    const option = document.createElement('option');
    option.setAttribute('class', 'btn')
    option.value = name;
    option.textContent = name;
    select.appendChild(option)
  }

}

set_config_names()


function set_cookie(cname, json) {
  const d = new Date();
  let parsed = JSON.stringify(json);
  parsed = btoa(parsed)
  d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  const write_to_cookie = cname + "=" + parsed + ";" + expires + ";path=/";
  document.cookie = write_to_cookie;
}

function get_cookie(cname) {
  const name = cname + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return null;
}

function check_cookie(cname) {
  console.log(cname);
  let user = get_cookie(cname);
  console.log(user);
  if (user === null) {
    console.log('no cookie found');
    return true
      // alert("Welcome again " + user);
      // draw_cookies();
  } else {
    console.log('cookie already in use');
    return false
      // if (user != "" && user != null) {
      //     set_cookie("cookies", user, 365);
      // }
  }
}

function get_all_cookie_names(){
  var pairs = document.cookie.split(";");
  var cookie_names = [];
  for (var i=0; i<pairs.length; i++){
    var pair = pairs[i].split("=");
    cookie_name = (pair[0] + '').trim();
    console.log(cookie_name);
    cookie_names.push(cookie_name);
  }
  return cookie_names;
}

// const doc = new jsPDF();
// // window.html2canvas = html2canvas;


// function save_pdf() {
//   // doc.html(document.getElementById('visualizations'), {
//   //   callback: function (doc) {
//   //     doc.save();
//   //   }
//   // });

//   // html2canvas(document.getElementById('visualizations')).then(canvas => document.body.appendChild(canvas));

//   const svgs = document.querySelectorAll('svg')
//   const imgs_uri = []
//   for (const svg of svgs) {
//     console.log(svg);
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d')
//     const v = canvg.Canvg.fromString(ctx, svg.outerHTML);
//     v.render();
//     window.open(canvas.toDataURL('image/png'));
//   }
//   console.log(imgs_uri);
// }

function storageAvailable(type) {
  var storage;
  try {
    storage = window[type];
    var x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      (storage && storage.length !== 0);
  }
}