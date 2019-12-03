/////////////////////
/********************
/* NUMBER FUNCTIONS *
/********************
/////////////////////

/**
 * maps a number from one range to the new range
 * @param {Number} value 
 * @param {Number} istart 
 * @param {Number} istop 
 * @param {Number} ostart 
 * @param {Number} ostop 
 * @returns the value between the new range
 */
function map(value, istart, istop, ostart, ostop) {
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

/**
 * clamps a value between a maximum and a minimum
 * @param {Number} val the value
 * @param {Number} min floor clamp
 * @param {Number} max ceil clamp
 * @returns the clamped value
 */
function clamp(val, min, max) {
  return Math.min(Math.max(min, val), max);
}
/**
 * @returns random integer between 0 and 100
 */
function randomMinMAx() {
  return MINIMUM + Math.floor(Math.random() * MAXIMUM);
}


function roundPrecision(value, precision) {
  if (typeof value === 'number') {
    let multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  } else return value;
}

/**
 * 
 * @param {String} val value from input element
 * @returns the value as number between 0 and 1
 */

function get_decimal_value(val) {
  val = parseFloat(val);
  if (val <= 1) return val;
  else {
    // if the value is bigger than one than we round it
    val = parseInt(val);
    const dec = val.toString();
    // console.log(dec)
    const result = val / Math.pow(10, dec.length);
    // console.log(result);
    return result
  }
}


///////////////////////////////
/******************************
/* ARRAY AND OBJECT FUNCTIONS *
/******************************
///////////////////////////////

/**
 * 
 * @param {Array} arr 
 * @param {String} key 
 */

function extract_unique_keys(arr, key) {

  const result = []
  arr.reduce((accumulator, curr_value, currentIndex, array) => {
    let parent = curr_value[key]
    result.push(parent)
  }, {})
  return result;
}


function random_arr_element(arr) {
  const random_idx = Math.floor(Math.random() * arr.length);
  return arr[random_idx];
}



function sumArray(arr1, arr2) {
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] === undefined || arr1[i] === null) arr1[i] = 0;
    arr1[i] += arr2[i]
  }
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * @param {Array} array 
*/
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}


////////////////////////////
/***************************
/* MODEL SPECIFICS METHODS *
/***************************
////////////////////////////

/**
 * this function returns an Object with the information about
 * the task to be fed in the Task class
 * @param {Number} time_needed Duration in seconds or ticks it takes to 'carry out' the task.
 * @param {Number} how_often how often the task needs to be carried out every day
 * @param {String} name name of the task
 * @returns Object
 */
function makeTask(time_needed, how_often, name) {
  return {
    amount_of_time: time_needed,
    executions_per_day: how_often,
    type: name
  }
}
/**
 * 
 * @param {String} name 
 * @param {Number} cur_val 
 * @param {Number} perf_val 
 * @param {Number} endu_val 
 * @param {Number} good_val 
 * @return an object with the traits
 */
function make_trait(name, cur_val, perf_val, endu_val, good_val, planning) {
  const sum = cur_val + perf_val + good_val;
  // console.log(cur_val / sum, perf_val / sum , endu_val, good_val / sum, name)
  return {
    trait: name,
    curiosity: cur_val / sum,
    perfectionism: perf_val / sum,
    endurance: endu_val,
    goodwill: good_val / sum,
    planning: planning
  }
}


function sort_agents(agents){
  return agents.sort((a, b)=> a.ID - b.ID);
}
function timeUpdate() {
  // return (1 / frameRate()) * TIME_SCALE;
  return 1;
}

function saveRAWData(agents, id) {
  let json = {};
  agents.sort(function (a, b) {
    return a.ID - b.ID;
  });
  console.log(agents);
  for (const agent of agents) {
    json['AGENT_ID_' + agent.ID] = agent.data;
  }
  saveJSON(json, 'RAW_DATA_' + nf(id, 4) + '.json');
}

function modelTime() {
  return TS_FRACTION * TIME_SCALE;
}

function combination_of_array_elements(arr) {
  const result = {
    i: [],
    ii: [],
    iii: [],
    iiii: []
  }
  for (let i = 0; i < arr.length; i++) {
    result.i.push([arr[i]])
    for (let j = i; j < arr.length; j++) {
      if (!(i === j)) {
        result.ii.push([arr[i], arr[j]]);
      }
      for (let k = j; k < arr.length; k++) {
        if (!(i === j || j === k)) {
          result.iii.push([arr[i], arr[j], arr[k]])
        }
        for (let l = k; l < arr.length; l++) {
          if (!(i === j || j === k || k === l)) {
            result.iiii.push([arr[i], arr[j], arr[k], arr[l]])
          }
        }
      }
    }
  }
  return result
}

/**
 * compute the linear regression of a line 
 * @param {Array} y positions on the y axis
 * @param {Array} x positions on the x axis
 * @returns Object containing slope, intercept and r2
 */
function linearRegression(y, x) {
  let lr = {};
  let n = y.length;
  let sum_x = 0;
  let sum_y = 0;
  let sum_xy = 0;
  let sum_xx = 0;
  let sum_yy = 0;

  for (let i = 0; i < n; i++) {

    sum_x += x[i];
    sum_y += y[i];
    sum_xy += (x[i] * y[i]);
    sum_xx += (x[i] * x[i]);
    sum_yy += (y[i] * y[i]);
  }

  lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
  lr['intercept'] = (sum_y - lr.slope * sum_x) / n;
  lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2);

  return lr;
}



