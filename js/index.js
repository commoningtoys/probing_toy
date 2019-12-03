////////////////////////////////////
/***********************************
/* DOM METHODS AND EVENT LISTENERS *
/**********************************/
////////////////////////////////////

let start_stop = false;
$('#start-stop').click(start_stop_model);

$('#show-menu').click(() => {
  $('.menu').toggle('fast');
  $('#show-menu').toggle('fast');
})

$('#close-menu').click(() => {
  $('.menu').toggle('fast');
})

// const minWage = document.getElementById('min-wage');
// minWage.addEventListener('change', event => {
//   $('#set-min-wage').text(minWage.value);
// });

$('#stress-increment').change(el => {
  console.log($('#stress-increment').val())
  irisModel.set_stress_increment($('#stress-increment').val());
  $('#set-stress-increment').text($('#stress-increment').val())
})

$('#stress-decrement').change(el => {
  console.log($('#stress-decrement').val())
  irisModel.set_stress_increment($('#stress-decrement').val());
  $('#set-stress-decrement').text($('#stress-decrement').val())
})



function start_stop_model() {
  console.log('start-stop');
  start_stop = !start_stop;
  if (start_stop) {
    $('#start-stop').text('RESTART');
    $('#show-menu').toggle('fast');
    clearInterval(tick);
    show_final_statistics();
    setTimeout(add_listeners_to_tooltips(), 2000);
  } else {
    $('#start-stop').text('STOP');
    if (batch_mode) {
      tick = setInterval(batch_executions, 0.1);
    } else {
      tick = setInterval(single_execution, 0.1);
    }

  }
}


function extract_traits() {
  // here we need to extract the values of the menu
  const result = [];
  // const traits_input = document.getElementsByClassName('traits-input');
  let index = 0;
  Object.keys(model_config.traits_list).forEach(key => {
    // here we extract the values we neeed
    const config = model_config.traits_list[key].config;
    const amount = model_config.traits_list[key].amount;
    // const amount = parseInt(elt.children['amount'].value);
    const trait_name = config.trait; // this must stay a string
    const cur_val = config.curiosity;
    const perf_val = config.perfectionism;
    const endu_val = config.endurance;
    const good_val = config.goodwill;
    // // console.log(elt.children);
    const planning = config.planning;
    // lets make the amount a global variable
    // AGENT_NUM = amount;
    // and we push them inside the array
    for (let i = 0; i < amount; i++)result.push(make_trait(trait_name, cur_val, perf_val, endu_val, good_val, planning));
    index++;
  })

  return result;
}

/**
 * sets the date in the web page
 * @param {Number} y years
 * @param {Number} m months
 * @param {Number} d days
 * @param {Number} h hours
 */
function set_date(y, m, d, h) {
  let currentDate = `<div class="date-el box">years: ${y}</div>
    <div class="date-el box">months: ${m}</div>
    <div class="date-el box">days: ${d}</div>
    <div class="date-el box">hours: ${h}</div>`;
  // console.log(currentDate);
  const date_el = document.getElementById('display-date');
  date_el.innerHTML = currentDate;
}

// suggestions tips

const help_tip = document.querySelector('div.help-tip')
document.onmousemove = mouse => {
  help_tip.style.top = mouse.y - 10 + 'px';
  help_tip.style.left = mouse.x + 10 + 'px';
}

function add_listeners_to_tooltips() {
  const tooltips_el = document.querySelectorAll('[data-title]');
  tooltips_el.forEach(tip => {
    tip.addEventListener('mouseover', elt => {
      help_tip.textContent = tip.dataset['title'];
      help_tip.style.display = 'block';
    })
    tip.addEventListener('mouseleave', elt => {
      help_tip.style.display = 'none';
    })
  })
}

// update_buttons();
// set_selects();
// init_menu();


let irisModel = null;
let loops = 50;
let players = 0;
let check_values = true;
let batch_mode = false;
let execution_is_finished = true;
let execution_combinations;
let tick;

function init_model(el) {
  const single_group = el.textContent;
  clearInterval(tick);
  start_stop = false;

  const traits_list = extract_traits();

  const min_wage = model_config.min_wage;
  const tasks_num = model_config.task_num;
  // const players = 0; // for now
  const model_type = model_config.model_type;
  const monthly_hours = model_config.monthly_hours;
  irisModel = new IrisModel(traits_list, min_wage, tasks_num, model_type, monthly_hours);

  const stop_model = 12

  irisModel.end_after(stop_model);
  irisModel.set_notifications(single_group);

  $('.panels-container').toggle('fast');
  $('.notifications').toggle('fast');
  tick = setInterval(single_execution, 1000);
}

let frame_count = 0;

function single_execution() {
  if (irisModel != null) {
    for (let i = 0; i < loops; i++) {
      irisModel.update();
    }
    if (frame_count % 15 == 0) {
      // irisModel.update_data();
      // irisModel.plot_data();
    }
    frame_count++;
  }
}

function show_final_statistics() {
  if (irisModel !== null) {
    // get decisions archive of the enabled agents
    const enabled_agents = irisModel.agents.filter(agent => agent.msg.enabled === true);
    // console.log(enabled_agents);
    const decisions_by_agent = {}
    for (const agent of enabled_agents) {
      decisions_by_agent[agent.ID] = {}
      let tot = 0;
      for (const decision of DECISIONS) {
        const filter_decisions = agent.decision_archive.filter(result => result.decision === decision)
        decisions_by_agent[agent.ID][decision] = filter_decisions.length;
        tot += filter_decisions.length;
      }
      decisions_by_agent[agent.ID]['total'] = tot;
    }
    console.log(decisions_by_agent);
    const summary = document.createElement('div');
    Object.keys(decisions_by_agent).forEach(key => {

    })
  }
}




















/**
 * this function fills the executions combination array with
 * all the possible combiation of agents in groups of 1, 2, 3 and 4 agents
 */
function init_batch() {

  batch_mode = true;
  const traits_list = [];
  const traits_input = document.getElementsByClassName('traits-input');

  for (const elt of traits_input[0].children) {
    // here we extract the values we neeed
    const amount = parseInt(elt.children['amount'].value);
    const trait_name = elt.children['trait'].value; // this must stay a string
    const cur_val = parseFloat(elt.children['curiosity'].value);
    const perf_val = parseFloat(elt.children['perfectionism'].value);
    const endu_val = parseFloat(elt.children['endurance'].value);
    const good_val = parseFloat(elt.children['goodwill'].value);
    // and we push them inside the array
    traits_list.push(make_trait(trait_name, cur_val, perf_val, endu_val, good_val));
  }
  execution_combinations = combination_of_array_elements(traits_list);
  $('.menu').toggle('fast');

  tick = setInterval(batch_executions, 0.1);//apparently it can't be faster than 5ms
}

function batch_executions() {
  if (execution_is_finished) {
    // reset model with new inputs
    initialize_batch()
    // set model to batch mode
    irisModel.set_batch_executions(true);
    // set termination of the model
    irisModel.end_after(24);
    execution_is_finished = false;
  } else {
    // execution_is_finished = true;
    if (irisModel.terminated) {
      execution_is_finished = true;
    }
    irisModel.update();
  }
}

/**
 * the function below executes all the combinations of agents with different numbers of tasks
 */

const max_task = 8;
const max_agents = 100;
let task_amount_counter = 1;
let combinations_counter = 0;
let combination_elts_length = 0;
let combination_elts_counter = 0;
let batch_save_txt = '';
let tot_batch_counter = 0;
function initialize_batch() {
  // get the combinations type: 1, 2, 3, or types of agents
  const curr_combinations = Object.keys(execution_combinations)[combinations_counter];
  // create  a text file with reference to this batch
  batch_save_txt = nf(tot_batch_counter, 4) + '_' + curr_combinations + '_task#' + task_amount_counter;
  console.log(batch_save_txt);
  // extract the combination 
  const combination_list = execution_combinations[curr_combinations];
  // execute all the elements of the list
  const agent_traits = combination_list[combination_elts_counter];
  const amount = max_agents / agent_traits.length;
  const traits_list = [];
  for (let i = 0; i < max_agents; i += amount) {
    const index = Math.floor(i / amount);
    for (let j = 0; j < amount; j += 1) {
      const traits = agent_traits[index]
      traits_list.push(make_trait(traits.trait, traits.curiosity, traits.perfectionism, traits.endurance, traits.goodwill))
    }
  }
  // initialize model
  const min_wage = parseInt(document.getElementById('min-wage').value);
  irisModel = new IrisModel(traits_list, min_wage, task_amount_counter, 0);
  task_amount_counter++;
  // slowly increase the values to be able to execute all the combinations with different ratios of agents | tasks
  if (task_amount_counter > max_task) {
    task_amount_counter = 1;
    combination_elts_counter++;
  }
  if (combination_elts_counter >= combination_list.length) {
    combination_elts_counter = 0;
    combinations_counter++;
  }
  if (combinations_counter >= 4) {
    console.log('terminate batch...')
    start_stop_model();
  }
  tot_batch_counter++;
}

