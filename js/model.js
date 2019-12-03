class IrisModel {
  constructor(traits, min_wage, num_task, model_type, monthly_hours) {
    this.batch = false;
    this.agents = [];
    this.tasks = [];

    this.model_type = model_type;

    this.traits = traits;
    this.traits_list = extract_unique_keys(this.traits, 'trait');

    this.max_time_coins = 0;

    this.model_date = {}

    this.hours = 0;
    this.days = 1;
    this.weeks = 0;
    this.months = 0;
    this.years = 0;
    this.setModelTime(); // THIS MAY YELD SOME BUGS IN THE FUTURE!!!
    let idx = 0;

    for (const trait of this.traits) {
      this.agents.push(new Agent(idx, trait, model_type, monthly_hours))
      idx++;
    }
    // make the info for all of the agents and set their initial time
    for (const agent of this.agents) {
      // agent.makeInfo(this.agents);
      // agent.setInfo();
      agent.set_time(this.model_date);
    }
    // add tasks
    // let restingTimePerTask = Math.floor(this.GLOBAL_RESTING_TIME / (TASK_LIST.length * num_task))
    for (let i = 0; i < num_task; i++) {
      for (const task of TASK_LIST) {
        this.tasks.push(new Task(task, min_wage, model_type));
      }
    }

    this.GLOBAL_RESTING_TIME = this.calcGlobalRestTime();
    this.getTotalRestingTime();
    this.counter = 0;

    this.timeUnit = 0;


    this.termination = 0;
    this.termination_counter = 0;
    this.terminated = false;
    /**
     * PLOT
     */

    this.colors = {
      // skill: color(0, 255, 0),
      // preference: color(255, 0, 255),
      fld: '#0ff',
      time_coins: '#f00',
      time_coins_real: '#fff',
      stress: '#ff0',
      aot: '#2d69f5',//color(45, 105, 245)
      swapped: '#00ff6496', //color(0, 255, 100, 150)
      brute_force: '#ff7d0096',//color(255, 125, 0, 150)
      spending_hours: '#fff'
    };



    // the plot will need an empty datapoint to construct it's structure
    // const datapoint = this.agents[0].data_point;
    // this.plot = new Plot(datapoint);
    // this.filter = [];
    // this.behavior = '';
    // const sel_1 = document.getElementById('agents-param-1').value;
    // const sel_2 = document.getElementById('agents-param-2').value;
    // this.params = [sel_1, sel_2];
    // this.plot = new Plot(parent, 20, 20, this.colors);
    this.pointIndex = 0;

    this.data;

    this.numShowAgents = 5;
    this.showFrom = 0;
    this.showTo = this.numShowAgents;

    this.recordAgentsData = false;
    this.recordDataCounter = 0;
    this.dataCollected = 0;
  }

  set_notifications(single_group) {
    if (single_group === 'solo') {
      const random_agent = random_arr_element(this.agents);
      random_agent.msg.enable();
    } else {
      const random_trait = random_arr_element(AGENT_BEHAVIORS);
      const random_agents = this.agents.filter(agent => agent.behavior === random_trait);
      random_agents.forEach(agent => agent.msg.enable());
    }
  }
  /**
   * calculates the global amount of time the agents have for resting
   * it doubles the amount of time needed to finish all the tasks by an agent
   * multiplied by two and by all the agents
   * @param {Number} num_agents 
   * @param {Number} num_task 
   * @returns the global amount of time the agents have to rest
   */
  calcGlobalRestTime() {
    let sum = 0;
    for (const task of this.tasks) {
      sum += task.time_coins_reserve;
    }
    // console.log(sum);
    return sum;
  }
  update() {
    this.setModelTime();
    // for(let i = 0; i < 10; i++){
    for (const agent of this.agents) {
      agent.set_time(this.model_date);
      agent.update();
    }

    for (const task of this.tasks) {
      task.updateUrgency(this.agents);
    }

    // here we need to redistribbute the time coins for all the tasks
    // this could be done every two months or every semester
    // this.distribute_time_coins();

    // this needs refactoring
    if (this.counter % TIME_SCALE == 0) {
      this.timeUnit++;

      // this.setModelTime();
    }
    this.counter++;
    // console.log(this.counter, this.timeUnit);
    // if we are recording the data, we show how much has been collected
    if (this.recordAgentsData) {
      for (const agent of this.agents) {
        this.dataCollected += agent.data.length;
      }
      $('#data-collected').text(this.dataCollected);
    }
  }

  get_median_values_by_behavior() {
    const medianValuesByBehavior = {};
    for (const behavior of this.traits_list) {
      const median = {};
      // here we extract the preferences of the agents by behavior
      // console.log(behavior)
      const extractedAgents = this.agents.filter(result => {
        // console.log(result)
        if (result.behavior_exp.traits.trait === behavior) return result
      });// need to change this to the behavior_exp!!!!
      // console.log(extractedAgents);
      if (extractedAgents.length == 0) continue;// if there is no extracted agent, than we skip to the next behavior
      // here we get the lenght of our data set
      const len = extractedAgents.length;
      const agentsData = {
        fld: [],
        time_coins_real: [],
        time_coins: [],
        stress: [],
        aot: [],
        swapped: [],
        brute_force: [],
        spending_hours: []
      }
      // here we extract all the preferences values 
      for (const agent of extractedAgents) {
        const fld = agent.preferenceArchive.map(result => result.feel_like_doing);
        const time_coins = agent.preferenceArchive.map(result => result.time_coins);
        const tcMax100 = agent.preferenceArchive.map(el => {
          if (el.time_coins > this.max_time_coins) {
            this.max_time_coins = el.time_coins;//here we update the max value for time coins 
          }
          let result = el.time_coins;
          result = (el.time_coins / this.max_time_coins) * 100;
          return result;
        });
        // const sh = agent.preferenceArchive.map(result => (result.spending_hours / 30) * 100);
        const sh = agent.preferenceArchive.map(result => (result.spending_hours));
        const stress = agent.preferenceArchive.map(result => result.stress_level);
        const aot = agent.preferenceArchive.map(result => result.amount_of_time);
        const swapped = agent.preferenceArchive.map(result => result.swapped);
        const bruteForce = agent.preferenceArchive.map(result => result.brute_force);
        agentsData.fld.push(fld);
        agentsData.time_coins_real.push(time_coins);
        agentsData.time_coins.push(tcMax100);
        agentsData.stress.push(stress);
        agentsData.aot.push(aot);
        agentsData.swapped.push(swapped);
        agentsData.brute_force.push(bruteForce);
        agentsData.spending_hours.push(sh);
      }
      // and calculate the median
      Object.keys(agentsData).forEach(key => {
        // console.log(result.fld);
        // here we get the array with the lowest amount of elements
        // to calculate the median we need all the arrays to be the same length
        // threfore we compute the minimum length of all the arrays
        const minLen = Math.min(...agentsData[key].map(result => result.length));
        let sum = Array(minLen).fill(0);
        for (let i = 0; i < agentsData[key].length; i++) {
          for (let j = 0; j < minLen; j++) {
            // console.log(i, j, agentsData.fld[i], agentsData.fld[0][j])
            // if (sum[j] === undefined || sum[j] === null) sum[j] = 0;
            if (key === 'swapped' || key === 'brute_force') {
              sum[j] += agentsData[key][i][j] == true ? 1 : 0;
            } else {
              sum[j] += agentsData[key][i][j];
            }
          }
        }
        // get the median
        if (key === 'swapped' || key === 'brute_force') { } else {
          for (let i = 0; i < sum.length; i++)sum[i] /= len;
        }
        median[key] = sum;
      });
      medianValuesByBehavior[behavior] = median;
    }
    return medianValuesByBehavior;
  }

  update_data(elt) {
    let time_filter = 'last';
    if (elt !== undefined) {
      // console.log(elt.value);
      time_filter = parseInt(elt.value);
    }
    this.data = this.agents.map(agent => {
      return {
        id: agent.ID,
        behavior: agent.behavior,
        date: agent.parsed_clock,
        memories: agent.memory.get_memories(time_filter)
      }
    })
    this.plot_data();
    this.plot_pies();
    this.plot_bar_chart();
  }
  plot_bar_chart() {

    let param = this.data.map(datapoint => {
      const val_1_arr = datapoint.memories[this.params[0]]
      const val_2_arr = datapoint.memories[this.params[1]]
      return {
        value_1: -(val_1_arr[val_1_arr.length - 1]),
        value_2: (val_2_arr[val_2_arr.length - 1]),
        id: datapoint.id,
        behavior: datapoint.behavior
      }
    });
    param = param.sort((a, b) => a.value_1 - b.value_1);
    this.plot.update_bar_chart(param);

  }
  plot_pies() {
    const pie_data = this.data.map(datapoint => {
      return {
        id: datapoint.id,
        decision: datapoint.memories.decision[datapoint.memories.decision.length - 1],
        task: datapoint.memories.executed_task[datapoint.memories.executed_task.length - 1]
      }
    });
    this.plot.update_pies(pie_data);
  }
  plot_data() {
    // possibility to filter by behavior
    // more granular filtering is done in plot.js
    const data = this.behavior == '' ? this.data : this.data.filter(datapoint => datapoint.behavior === this.behavior);
    // disable options that are not associated with that behavior
    const options = document.getElementById('agents-list').options;
    if (this.behavior !== '') {
      for (const option of options) {
        option.disabled = false;
      }
      for (const option of options) {
        if (!option.innerText.includes(this.behavior)) option.disabled = true;
      }
    } else {
      for (const option of options) {
        option.disabled = false;
      }
    }


    if (this.filter.length > 0) {
      let filtered_data = [];
      for (const item of this.filter) {
        filtered_data = filtered_data.concat(data.filter(value => value.id === item))
      }
      this.plot.update_chart(filtered_data);
    } else {
      // console.log(data);


      this.plot.update_chart(data);
    }
  }

  show_behavior(el) {
    this.behavior = el.innerText.toLowerCase();
    this.plot_data()
  }

  filter_agents(elt) {
    this.filter = []
    for (const el of elt.selectedOptions) {
      this.filter.push(el.value);
    }
    // console.log(this.filter);
    this.plot_data();
  }

  filter_params() {

    const sel_1 = document.getElementById('agents-param-1').value;
    const sel_2 = document.getElementById('agents-param-2').value;
    this.params[0] = sel_1;
    this.params[1] = sel_2;

    this.plot_bar_chart();

  }

  reset_filters() {
    this.behavior = '';
    this.filter = [];
    this.plot_data();
  }

  show_task_archives() {
    const sorted_agents = sort_agents(this.agents);
    noStroke();
    const w = width / DATA_POINTS;
    const h = height / this.agents.length;
    let idx_h = 0;
    for (const agent of sorted_agents) {
      const decisions = agent.get_decision_archive().map(result => result.decision);
      let idx_w = 0;
      for (const decision of decisions) {
        fill(agent.colors[decision]);
        rect(idx_w * w, idx_h * h, w, h);
        idx_w++;
      }
      idx_h++;
    }
  }
  /**
   * sets the time passed in the form of hours | days | months | yeara
   */
  setModelTime() {
    // if (this.timeUnit > 0 && this.timeUnit % TS_FRACTION == 0) {
    this.hours++;
    // }
    if (this.hours > 0 && this.hours % 24 == 0) {
      // here we update the agent status rest and availability to work
      // for (const agent of this.agents) {
      // for (let i = 0; i < this.agents.length; i++) {
      //   const agent = this.agents[i];
      //   agent.resting = false;
      //   agent.done_for_the_day = false;
      //   agent.add_data_to_archive();
      // }
      this.agents.forEach(agent => {

        agent.add_data_to_archive();
        agent.resting = false;
        agent.done_for_the_day = false;
      })
      this.days++;
      this.hours = 0;
      this.distribute_time_coins();
    }
    if ((this.days > 1 && this.days % 31 == 0) || (this.days > 1 && (this.days % 29 == 0 && this.months === 1))) {// shorter month on february
      // here we need to reset the spent time of the agents if its the spending model
      if (this.model_type === 'time-spending') {
        for (const agent of this.agents) {
          agent.reset_spending_time();
        }
      }
      this.months++;
      this.days = 1;

      this.termination_counter++;
      if (this.batch) {
        // save images every 3 months
        // if(this.months % 2 === 0)this.show();
        if (this.months % 12 === 0) {
          this.show();
          const d = new Date();
          const milliseconds = Date.parse(d) / 1000;
          let save_txt = milliseconds + '_' + batch_save_txt + '_model';
          console.log(save_txt);
          // saveCanvas(save_txt, 'png');
        }

        if (this.termination_counter >= this.termination) {
          this.terminated = true;
        }
      } else {
        if (this.termination_counter >= this.termination) {
          console.log('terminate');
          start_stop_model();
          const d = new Date();
          const milliseconds = Date.parse(d) / 1000;
          let save_txt = batch_save_txt + '_' + milliseconds + '_model';
          // save_txt = save_txt.replace('.', '_');
          // saveCanvas(save_txt, 'png');
        }
      }
    }
    if (this.months > 0 && this.months % 12 == 0) {
      this.years++;
      this.months = 0;
      this.weeks = 0;
    }

    this.model_date = {
      h: this.hours,
      d: this.days,
      m: this.months,
      y: this.years
    }
    set_date(this.years, this.months, this.days, this.hours)
    // Object.keys(this.model_date).forEach(key => {
    //   const date_div = document.createElement('div');
    //   date_div.setAttribute('class', 'date-el');
    //   date_div.textContent = `${key}: ${this.model_date[key]}`
    //   date_el.appendChild()
    // })

  }
  end_after(val) {
    this.termination = val;
  }

  set_batch_executions(bool) {
    this.batch = bool;
  }

  /**
   * computes the total resting time in the model
   */
  getTotalRestingTime() {
    let sumAgent = 0;
    for (const agent of this.agents) {
      sumAgent += agent.time_coins;
    }
    let sumTask = 0;
    for (const task of this.tasks) {
      sumTask += task.time_coins_reserve;
    }
    // console.log(`agent resting time: ${sumAgent}, task time_coins_reserve: ${sumTask} GLOBAL ${this.GLOBAL_RESTING_TIME}`);
  }

  distribute_time_coins() {
    // here we need to redistribute the time coins
    // between the task to avoid that some tasks accumulate
    // all the time coins
    const get_coins = this.tasks.map(result => result.time_coins_reserve)
    const sum = get_coins.reduce((acc, curr) => acc + curr);
    const result = Math.floor(sum / this.tasks.length);
    const advance = sum % this.tasks.length;
    // console.log(sum, result, advance);
    for (const task of this.tasks) {
      task.time_coins_reserve = result;
    }
    const rand_idx = Math.floor(Math.random() * this.tasks.length)
    this.tasks[rand_idx].time_coins_reserve += advance
    // console.log(this.tasks);
    // console.log(sum, result)

  }

  /**
   * this methods records the data generated by the agents and stores it
   * in JSON that can be saved by the client
   */
  recordData() {
    console.log('RECORDING...');
    this.recordAgentsData = !this.recordAgentsData;
    if (this.recordAgentsData) {
      for (const agent of this.agents) {
        agent.data = []; // empty the data set
        agent.recordData = true;
      }
      $('#record-data').html('<span id="data-collected"></span> entries<br>(click again to save)');
    } else {
      $('#record-data').text('RECORD DATA');
      for (const agent of this.agents) {
        agent.recordData = false;
      }
      saveRAWData(this.agents, this.recordDataCounter);
      this.dataCollected = 0;
      this.recordDataCounter++;
    }
  }
  /**
   * sets the minimum wage in the model
   * at the beginning it is 0
   */
  setMinWage(val) {
    console.log(val);
    for (const task of tasks) {
      task.minWage = val;
    }

  }
  /**
   * sets the behavior of all the agents to a specific behavior
   */
  setAgentsBehavior(behavior) {
    console.log(behavior);
    for (const agent of this.agents) {
      agent.behavior = behavior;
      agent.makeInfo(this.agents);
      agent.setInfo();
    }
  }
  setView(val) {
    console.log(val);

    this.showFrom = val - 2;
    this.showTo = val + 3;
    if (this.showFrom < 0) this.showFrom = 0;
    if (this.showTo > this.agents.length) this.showTo = this.agents.length;
  }

  set_stress_increment(val) {
    console.log(val)
    for (const agent of this.agents) {
      agent.stress_increase_val = parseFloat(val);
    }
  }

  set_stress_decrement(val) {
    console.log(val)
    for (const agent of this.agents) {
      agent.stress_decrease_val = parseFloat(val);
    }
  }
  /**
   * player interactions below
   */
  playerExecuteTask() {
    // console.log('YES');
    let task_name = $('#task-name').text();
    // console.log(task_name);
    let agent = this.returnPlayerAgent();
    console.log(agent);
    agent.playerWorks(this.agents);
    // let task = tasks.filter(obj => obj.type === task_name);
    // task = task.filter(obj => {
    //   for(const a of obj.agentsPool){
    //     a.ID === PLAYER_ID;
    //     return obj;
    //     // break
    //   }
    // })
    // loop();
    $('.player-interface').toggle();
  }

  playerTradeTask() {
    let el = $('select#other-tasks option:selected');
    let agent = this.returnPlayerAgent();
    // console.log(agent);
    agent.playerTrades(el.text());
    loop();
    $('.player-interface').toggle();
    // console.log($('.player-interface')[0].attributes[1].value);
  }

  playerRest() {
    console.log('REST');
    const agent = this.returnPlayerAgent();
    agent.playerRests()
    loop();
    $('.player-interface').toggle();
  }

  startPlayerTime() {
    console.log('start');
    let agent = this.returnPlayerAgent();
    agent.playerTimer = 0;
    agent.playerWorking = true;
    console.log(agent.playerWorking);
    loop();
  }

  stopPlayerTime() {
    console.log('stop');
    let agent = this.returnPlayerAgent();
    // updateAttributes(task, agents, brute_forced, _amount_of_time)
    agent.updateAttributes(agent.playerTaskToExecute, this.agents, false, agent.playerTimer);
    agent.playerWorking = false;
    agent.working = false;
    if (agent.hasTraded) {
      agent.hasTraded = false;
      agent.tradeTask = '';
    }
    agent.setInfo();
    setTimeout(() => {
      $('.player-work').hide('fast')
    }, 500)
  }

  returnPlayerAgent() {
    return this.agents.filter(obj => obj.ID === document.getElementById('yes').value)[0];
  }
}

class Task {
  /**
   * The task Object it takes a a task_object with the specification
   * for the amount of time the task takes how often neeeds to be executed each day
   * and the name of the task
   * @param {Object} task_object a task object
   * @param {Number} global_resting_time amount of time/value that the task can give to the agent 
   */
  constructor(task_object, min_wage, model_type) {
    // this.time_coins_reserve = global_resting_time;
    // console.log(this.time_coins_reserve)
    this.spending_model = model_type === 'time-spending' ? true : false;
    /**
     * time needed to carry out the task
     */
    this.aot = task_object.amount_of_time;
    // console.log(this.aot);
    this.time_coins_reserve = 4 * this.aot;
    /**
     * Value of a task expresses the relative exchange rate to other task.
     * The value of a task goes up every time an agent decides to 'trade'.
     * The value goes down every time an agent (or agents) decide to 'carry out' the task.
     */
    this.value = 0;// BETWEEN 1 - 100
    this.minWage = min_wage;
    this.agentsPool = [];// this is the pool of availabale agents where task picks a random one
    this.swapping_agents = 0;// to keep track of the agents that traded
    /**
     * after how many ticks do I need to call this task again?
     * here we need an algorithm that calculates the urgency based
     * on how often the task needs to be carried out.
     */
    this.urgency = Math.floor(DAY / task_object.executions_per_day) + Math.floor(Math.random() * 10);
    // console.log(this.urgency);
    /**
     * WE NEED TO MAKE THE URGENCY A LITTLE BIT MORE FLUCTUANT SO THAT THE TASK NEVER REALLY OVERLAP
     */
    this.urgencyReset = this.urgency; //we need this to reset the urgency
    this.type = task_object.type;
    this.executed = 0;
    // DEPRECATED FOR NOW
    this.skillNeeded = randomMinMAx();//this needs to be better defined
    /////////////////////////////////
    // this.pos = createVector(x, y);
    // this.r = 10;
  }
  /**
   * show the task development over time
   */
  show() {
    fill(255);
    let h = (this.aot / TIME_SCALE) * 10;
    // console.log(h);
    rect(this.pos.x, this.pos.y, this.r, -h);
  }
  /**
   * this method is called every tick by decreasing
   * the urgency when it reaches 0 it wil be reset to its original value.
   */
  updateUrgency(agents) {
    this.urgency -= timeUpdate();
    if (this.urgency <= 0) {
      // console.log('choose agent for the task: ' + this.type);
      this.urgency = this.urgencyReset;
      // every time the uregency reaches 0 we update the value in the future
      // the preference of the agent may vary according on how often he executed the same task
      if (!this.spending_model) this.updateValue(agents);// we update the value only when the mocdel runs on the accumulate model
      this.executed++;
      // here we choose the agent to carry out the task
      this.chooseAgent(agents);
      // noLoop();
    }
  }
  /**
   * the value is defined by the amount of the agent that want to take the task.
   * @param {Array} agents 
   */
  updateValue(agents) {
    // INVERSE TO THE NUMBER OF AGENTS WITH PREFERENCE FOR SUCH TASK
    // here we remove some time from the amout of resting tim the task can give away
    let counter = agents.length;// we start from 1 to avoid 0 as result, this will result in a minimum value
    const NUMBER_OF_AGENTS = agents.length;
    for (const agent of agents) {
      // we go through all the agents if their preferred task matches 
      // this task we add one to the counter
      let preference = agent.preferredTask();
      if (preference === this.type) {//string comparison
        counter--;
      }
    }
    /**
     * else we return a value that is inverse proportional
     * as many agents prefer that task as lower it is its value
     * but it can't be 0
     * 
     * If the model gives a minimum resting time than the capitalist
     * are more stressed. if we let the model give 0 resting time 
     * than the capitalist are the less stressed.
     */
    let amountOfTime = this.minWage + ((NUMBER_OF_AGENTS - counter) / NUMBER_OF_AGENTS) * this.aot;
    amountOfTime = Math.ceil(amountOfTime);
    // console.log(this.type, amountOfTime, this.aot, counter);
    // down here we remove time from the GRT if it reaches 0 it stays 0!
    if (this.time_coins_reserve > 0) {
      if (this.time_coins_reserve - amountOfTime < 0) {
        // if the amount of time computed above is 
        // bigger than the reserve of resting time
        // than we set the value to be the leftover of the 
        // resting time. here we also need to set the
        // resting time reserve to 0 because ve removed all of it.
        this.value = this.time_coins_reserve;
        this.time_coins_reserve = 0;
      } else {
        // else we set the amout of time as the valuse for the task
        this.value = amountOfTime;
        this.time_coins_reserve -= amountOfTime;
        // this.time_coins_reserve = roundPrecision(this.time_coins_reserve, 1)
      }
    } else {
      // here we don't give any resting time
      // we should think also on how the agent react when no resting time is given for a task
      this.value = 0;
      this.time_coins_reserve = 0;
    }
    return;
  }

  updateGRT(amount_of_time) {

    this.time_coins_reserve += amount_of_time;
    // console.log(`task ${this.type} GRT got updated by ${amount_of_time}, total GRT = ${this.time_coins_reserve}`)
  }

  /**
   * The task chooses one agent from the available pool.
   * The task is assigned by picking enough agents that with 
   * their skill will reduce urgency to 0.
   * Inside here we need take in consideration the trade function 
   * of the agent.
   * @param {Array} agents 
   */
  chooseAgent(agents) {

    this.agentsPool = [];
    this.swapping_agents = 0;
    // shuffleArray(agents);// we shuffle the agents 
    // here we filter out all the agents who already have done the task for the day
    let available_agents = agents.filter(agent => (agent.done_for_the_day === false && agent.spending_hours > 0) && !agent.working && !agent.resting);
    // console.log(available_agents);
    let swapping_agents = available_agents.filter(agent => agent.has_swapped === true);
    // console.log(swapping_agents.length);
    // available_agents = available_agents.filter(agent => agent.behavior_exp.compute_resting(agent, this) === false)

    // here we add the vailable agents who did  not swap to the agents pool
    // this will be used later in the case no agent has swapped for this task
    this.agentsPool = available_agents.filter(agent => agent.has_swapped === false);

    // what if there is no available agents? brute force
    if (this.agentsPool.length <= 0) {
      // console.log('no agents available... brute forcing...');
      this.bruteForceTask(agents);
    }

    // here we select the swapping agent if there is any
    swapping_agents = swapping_agents.filter(agent => agent.swap_task === this.type);
    // console.log(`swapping agents with ${this.type}: ${swapping_agents.length}`);
    if (swapping_agents.length > 0) {
      // here we pick a random agent that has swapped for this task
      const rand_idx = Math.floor(Math.random() * swapping_agents.length);
      const chosen_agent = swapping_agents[rand_idx];
      // the agent executes the task
      chosen_agent.work(this, agents, false);
      chosen_agent.has_swapped = false; // here we reset the status of the agent!!
      return // we return as the task has been executed
    }


    /*
     ######  ####### ######  ######  #######  #####     #    ####### ####### ######
     #     # #       #     # #     # #       #     #   # #      #    #       #     #
     #     # #       #     # #     # #       #        #   #     #    #       #     #
     #     # #####   ######  ######  #####   #       #     #    #    #####   #     #
     #     # #       #       #   #   #       #       #######    #    #       #     #
     #     # #       #       #    #  #       #     # #     #    #    #       #     #
     ######  ####### #       #     # #######  #####  #     #    #    ####### ######

    */
    // // here we check if the agent has traded before if yes he executes the task
    // for (const agent of available_agents) {
    //   // skill = agent.getPreferences(this.type).skill_level;
    //   if ((agent.has_swapped && agent.swap_task === this.type) && (!agent.working || !agent.resting)) {
    //     // this is where chooseTask() happens
    //     if (agent.isPlayer) {
    //       // if the agent is the player than make him work
    //       agent.playerTaskToExecute = this;
    //       agent.has_swapped = false; // reset here the traded boolean
    //       agent.playerWorks(agents);
    //       return;// WE RETURN BECAUSE THE AGENT IS THE PLAYER THEREFORE WE DON'T NEED TO CHECK FOR MORE AGENTS TO DO THE TASK
    //     } else {
    //       /**
    //        * I THINK THERE IS A LOGIC PROBLEM HERE
    //        * IT MIGHT BE BETTER TO PUT ALL THE AGENT THAT 
    //        * TRADED FOR THIS TASK ONTO A POOL AND THEN PICK A RANDOM ONE
    //        */
    //       // this.agentsPool.push(agent);
    //       this.swapping_agents++;
    //       //////DEPRECATED//////
    //       // amountOfSkill += skill;// we will use this when we will need more agents to carry out the task
    //       //////////////////////
    //       // console.log(agent.ID, agent.swap_task)
    //       agent.work(this, agents, false);//the agent works
    //       agent.has_swapped = false; // reset here the traded boolean | needs to be done after the the agent.work otherwise the it is not possible to visualize the trade happening
    //       // this.executed++;
    //       // console.log('swapping agent doing the task!');
    //       return;// IF THE AGENT HAS TRADED FOR THIS TASK THAN HE GETS PICKED THEREFORE WE RETURN
    //     }
    //   } else if (!agent.working && agent.ability && !agent.has_swapped) {// maybe the trade happens once we have the pool
    //     this.agentsPool.push(agent);// IF NONE OF THE ABOVE THINGS HAPPENED THAN WE PUSH THE AGENT INTO A POOL OF POSSIBLE CANDIDATE FOR THE TASK
    //   }
    // }


    /**
     * here is where the swapping happens we have a pool 
     * of agents that are not working and able
     * the task should pick a random agent from the pool
     * if he trades than it looks for another agent
     */
    // console.log('agent pool: ', this.agentsPool.length);
    let swapping = true;
    let maximumTradings = 10000;
    let counter = 0;
    while (swapping) {
      let randIndex = Math.floor(Math.random() * this.agentsPool.length);
      const agent = this.agentsPool[randIndex];// here we pick a random agent from the pool

      if (counter > maximumTradings || this.agentsPool.length < 1) {
        // we need to handle the case in which no agent is available for one task
        this.bruteForceTask(agents);
        // flush the pool
        this.agentsPool = [];
        // console.log(`NO AGENT FOUND FOR ${this.type}!`);
        // noLoop();
        break;
      } else {
        if (!agent.swap_2(this, agents)) {
          // console.log('swapped')
          // if the agent has not traded 
          // then he executes the task
          agent.work(this, agents, false);// we set the agent at work
          // this.executed++;
          swapping = false;// here we exit the while loop
          // flush the pool
          this.agentsPool = [];
          break;//DEPRECATED
        } else {
          // if the agent has traded we remove him from the pool
          // so he can't be picked the next time 
          this.agentsPool.splice(randIndex, 1);
          // console.log('agent pool after swapping: ', this.agentsPool.length);
        }
      }
      counter++;
    }
  }

  bruteForceTask(agents) {
    // //assigns the task to someone as next task to do.
    // console.log('BRUTE FORCE!!!');
    let i = 0;
    let controlState = true;
    while (controlState) {
      let index = Math.floor(Math.random() * agents.length);
      let agent = agents[index];
      // console.log(`working: ${agent.working}, resting: ${agent.resting}, traded: ${agent.has_swapped}`);
      if (!agent.working || agent.resting || agent.has_swapped || agent.isPlayer) {
        /**
         * HERE WE NEED TO CHECK WHICH 
         * BEHAVIOR THE AGENT HAS
         * AND ACCORDING TO THAT THE FLD
         * NEEDS TO BE UPDATED ACCORDIGLY
         * 
         * For now it doesn't let player to be brute forced
         */
        agent.resting = false;
        agent.restingTimer = 0;
        // check resting timer!!!
        agent.has_swapped = false;
        agent.swap_task = '';
        agent.increase_stress(1);
        agent.work(this, agents, true);
        // agent.FLD /= 2;
        // add this to the html text
        // console.log(`agent_${agent.ID} has been brute forced to do ${this.type}`);
        controlState = false;
        break;
      }

      i++;
      if (i > 5000) {
        // assign task as next to do to an agent
        // console.log('no agent found');
        controlState = false;
        break;
      }
    }
    // for (const agent of agents) {
    //     if(agent.resting || agent.has_swapped){
    //         console.log(agent.ID);
    //     }
    // }
  }
  /**
   * 
   * @param {Number} skill_level the skill level for this task
   * @returns the amount of time the agent needs to complewte the task
   */
  amountOfTimeBasedOnSkill(skill_level) {
    /**
     * we assume that an agent with medium skill
     * will complete the task in the assigned amount of time
     * but highly skilled or lower skilled agents will complete it 
     * in less or more time
     */
    const MEDIUM_SKILL = MAXIMUM / 2;// we define the medium skill level
    // here we subtract the skill level the the medium skill level and we divide it 
    // by maximum to get a value between 0 and 1, that we multiply by the time scale.
    // the result will oscillate between -0.5 and +0.5 that we multiply by the time scale
    let result = ((MEDIUM_SKILL - skill_level) / MAXIMUM) * this.aot;
    result = Math.round(result);
    result += this.aot;
    // console.log(`${this.type}this is the skill level: ${skill_level} and this the median: 50. this is the amount of time: ${this.aot} and the result: ${result}`);
    const MINIMUM_TIME = TIME_SCALE;// this is the minimum time an agent has to invest for an assigned task aka 1 hour
    if (result <= MINIMUM_TIME) return MINIMUM_TIME;// if the result is less than the minimum time return the minimum time
    else return result;// else return the result
  }
}

class Agent {
  constructor(id, _traits, model_type, monthly_hours, messaging_enabled) {
    const id_len = 4 - id.toString(10).length;
    let zeroes = '';
    for (let i = 0; i < id_len; i++)zeroes += '0'
    this.ID = zeroes + id;

    this.spending_model = model_type === 'time-spending' ? true : false;
    this.monthly_hours = model_type === 'time-spending' ? monthly_hours : 0;
    this.spending_hours = this.get_spending_hours(model_type);
    // console.log(model_type);

    this.behavior = _traits.trait;//_behavior;
    this.behavior_exp = new Behavior(_traits, this);
    this.time_coins = 0;
    this.resting = false;
    this.restingTimer = 0;
    this.preferences = this.makePreferences(TASK_LIST);//preferences for each single task
    const val = (10 + Math.floor(Math.random() * 40)) / 100;
    this.forget_rate = val;
    this.step = 10;
    // console.log(this.forget_rate)
    /**
     * if the agent is perfectionist we need to define
     * the task he wants to master
     */
    // if (this.behavior === 'perfectionist') {
    let max = 0;
    let myObj = this.preferences;
    let result = ''
    Object.keys(myObj).forEach(key => {
      let pref = myObj[key].skill_level;
      let name = myObj[key].task_name;
      // console.log(pref, name)
      if (pref > max) {
        max = pref;
        result = name;
      }
    });
    result = random_arr_element(Object.keys(this.preferences))
    // the master tast is the one with higher skill level
    this.masterTask = result;
    // console.log(this.masterTask);
    // }

    // the next attributes are used for the trading system,
    this.swap_task = '';// this defines the task the agent wants to do
    this.has_swapped = false;// if has swapped than it will be selecteds for the trade task
    this.totalTaskCompleted = 0;
    this.totalTaskCompletedByAgents = 0;

    this.done_for_the_day = false;
    const year = new Date().getFullYear();
    this.initial_date = new Date(year, 0, 1);
    this.parsed_clock = this.initial_date;
    this.inner_clock = {}

    this.currentTask = '';
    this.FLD = MAXIMUM; //this.behavior === 'capitalist' ? 100 : randomMinMAx();// feel like doing
    this.solidarity = randomMinMAx();
    this.stress = 0;// we will need this to see how stressed the agents are, the stress will increase when the agents can't rest while FLD is 0
    this.stress_decrease_val = 1.5;
    this.stress_increase_val = 1;
    this.ability = true;
    this.wasBruteForced = false;
    // working attributes
    this.working = false;
    this.workingTimer = 0;// how long is the agent at work

    this.decision_archive = [];
    this.decision = '';

    this.mappedAmountOfTime = 0;
    this.showStatistics = false;

    this.preferenceArchive = [];
    this.data = [];
    this.data_point = {
      preferences: this.preferences,
      executed_task: null,
      time_coins: this.time_coins, // this maps the value to a better scale¿
      feel_like_doing: this.FLD,
      spending_hours: this.spending_hours,
      stress_level: this.stress,
      amount_of_time: this.mappedAmountOfTime,
      swapped: this.has_swapped,// === true ? this.swap_task : '',
      brute_force: this.wasBruteForced,
      // inner_clock: this.inner_clock,
      parsed_clock: this.parsed_clock,
      decision: this.decision
    };

    this.memory = new Memory(this.data_point)


    this.recordData = false;

    this.msg = new PostMessage(this.ID);
  }

  set_time(time_obj) {
    const h = this.initial_date.getHours();
    const d = this.initial_date.getDate();
    const m = this.initial_date.getMonth() + 1;
    const y = this.initial_date.getFullYear() + time_obj.y;

    // console.log(`h: ${h} || d: ${d} || m: ${m} || y: ${y}`);
    const str = `${time_obj.m + 1}/${time_obj.d}/${y}  ${time_obj.h}:00`
    // // console.log(str);
    // const model_date = new Date(str);
    // console.log(model_date);
    this.parsed_clock = new Date(str)
    this.inner_clock = time_obj;
  }
  /**
   * @returns agent innerclock in date format
   */
  get_date() {
    return this.parsed_clock;
  }
  get_inner_clock() {
    return JSON.parse(JSON.stringify(this.inner_clock));
  }
  inner_clock_to_string() {
    return `${this.inner_clock.d}/${this.inner_clock.m + 1}/${this.inner_clock.y + this.initial_date.getFullYear()}  ${this.inner_clock.h}:00`
  }
  push_to_decision_archive(_decision) {
    // TO DO check if the object is correct!
    // obj should be made by a: whether agent has worked, swapped or rested
    // a time reference
    const obj = {
      decision: _decision,
      time: this.get_inner_clock()
    }
    this.decision_archive.push(obj);
    this.decision = _decision;
  }
  get_decision_archive() {
    return JSON.parse(JSON.stringify(this.decision_archive));
  }
  get_spending_hours(model_type) {
    if (model_type === 'time-spending') return this.monthly_hours
    else return 1;
  }

  reset_spending_time() {
    // this.spending_hours = this.monthly_hours;
    if (this.spending_hours <= 0) {
      this.spending_hours += this.monthly_hours;
      // this.spending_hours = this.monthly_hours;
    } else {
      // this agent has not used up all his monthly hours
      // what to do?
      this.spending_hours = this.monthly_hours + this.spending_hours;
    }
    // let update_hours = 0;
    // if(this.spending_hours > 0){
    //   update_hours = this.spending_hours;
    // }
    // this.spending_hours = this.monthly_hours + update_hours;
  }
  /**
   * here the agent works
   */
  update() {
    // make the task archive constarined within a max value
    if (this.decision_archive.length > DATA_POINTS) {
      this.decision_archive.splice(0, 1);
    }
    /**
     * here we need to add the resting 
     * similar to working. resting should also get a timer
     */
    if (this.playerWorking) {
      this.playerTimer++;
      $('#timer').html(this.playerTimer);
      this.setInfo();
    }

    if (this.working && !this.isPlayer) {

      this.workingTimer -= timeUpdate();
      // this.setInfo();
      if (this.workingTimer <= 0) {
        this.has_swapped = false;// reset to false, very IMPORTANT otherwise the agent will always be called to do a swapped task
        this.swap_task = '';
        this.working = false;
        this.data_point.executed_task = this.currentTask;
        this.currentTask = '';
        this.done_for_the_day = true;
        // this.setInfo();
      }
    }
  }
  swap_2(task, agents) {
    return this.behavior_exp.decide(task, agents, this);
  }

  increase_stress(mult) {
    const multiplier = mult || 1;
    this.stress += this.stress_increase_val * multiplier;
    this.stress = clamp(this.stress, MINIMUM, MAXIMUM);
  }

  taskValue(agents, task_name) {
    let counter = agents.length;
    const NUMBER_OF_AGENTS = agents.length;
    for (const agent of agents) {
      // we go through all the agents if their preferred task matches 
      // this task we add one to the counter
      const preference = agent.preferredTask();
      if (preference === task_name) {
        counter--;
      }
    }
    return ((NUMBER_OF_AGENTS - counter) / NUMBER_OF_AGENTS);
  }


  /**
   * sets the agent at work for a given amount of time
   * @param {Number} amount_of_time 
   */
  work(task, agents, brute_forced) {
    if (brute_forced) {
      this.msg.post_message('brute force: ', to_emoji[task.type],this.inner_clock_to_string() +' | ' + to_emoji['stress'] + ': '+this.stress, 'brute-forced');
    } else {
      this.msg.post_message('work: ', to_emoji[task.type], this.inner_clock_to_string() +' | ' + to_emoji['stress'] + ': '+this.stress, 'work');
    }
    // console.log('work...', this.ID);
    const decision = brute_forced === true ? 'brute-forced' : 'work'
    this.push_to_decision_archive(decision);
    const skill = this.getPreferences(task.type).skill_level;
    const amount_of_time = this.spending_model == true ? task.aot : task.amountOfTimeBasedOnSkill(skill);

    // here we handle the time of the spending model
    if (this.spending_model && brute_forced === false) {
      this.spending_hours -= amount_of_time;
    }

    this.working = true;
    this.workingTimer = amount_of_time;
    this.updateAttributes(task, agents, amount_of_time, brute_forced);
    this.currentTask = task.type;// we set the current task according to the task the agent is currently working on
    // this.setInfo();
    // this.makeInfo(`AGENT: ${this.ID} is executing ${task.type}. It will take ${amount_of_time} ticks`);
  }

  rest(task) {

    this.msg.post_message('', to_emoji['rest'], this.inner_clock_to_string() +' | ' + to_emoji['stress'] + ': '+this.stress, 'rest')
    if (!this.spending_model) {
      this.time_coins -= task.aot; // we could also double this amount
      task.updateGRT(task.aot);
    }
    // this.time_coins /= 2;// here add slider that chenges how much resting time is decreased
    // this.makeInfo(`AGENT: ${this.ID} is resting. Resting time ${this.time_coins}`);
    // console.log(`AGENT: ${this.ID} is resting. Behavior ${this.behavior} Resting time ${this.time_coins}`);
    this.FLD = MAXIMUM;// ?? should the FLD go to maximum??
    this.resting = true;
    this.restingTimer = task.aot;
    // when the agent has rested he also is less stressed
    this.stress /= this.stress_decrease_val;
    // this.updateAttributes(task, true);
    // this.setInfo();
  }

  assign_swapped_task(task_name) {
    this.msg.post_message('swap for:', to_emoji[task_name], this.inner_clock_to_string() +' | ' + to_emoji['stress'] + ': '+this.stress, 'swap')
    // console.log('swap...')
    this.has_swapped = true;
    this.swap_task = task_name;
    // this.setInfo();
  }

  /**
   * @returns a random task
   */
  randomTask(task_name) {

    // here we can check the preference for the task?

    // swapped task should be different than this task
    let result = ''
    let loop = true;
    while (loop) {
      // const index = Math.floor(Math.random() * this.preferences.length);
      let randObj = random(TASK_LIST);
      if (randObj.type !== task_name) {
        result = randObj.type;
        loop = false;
        break;
      }
    }
    // console.log(`result: ${result}`)
    return result;
  }
  /**
   * 
   * @param {Array} task 
   * @param {Array} agents 
   */
  updateAttributes(task, agents, _amount_of_time, brute_forced) {
    /**
     * - resting time (++) increases by some value depending on the value of the task
     * - preference (could be fixed, or updating, as described on the left); 
     * - laziness (+++) increase to maximum after having completed a task, then slowly decrease
     * - skill (+) a small increase in skill for the task the agent completed
     * - solidarity changes only if the agent has taken up a task instead of a NOT_able_agent (+)
     * - ability randomly goes to false (or true)
     * - occupied (true) agent becomes occupied when doing the task (not trading);
     *   it stays occupied for the duration of Taks's amount of time
     */
    this.updateCompletedTasks(task.type);
    this.updateFLD(agents, task, brute_forced);
    this.time_coins += task.value;// * task_executed == true ? 1 : -1;
    // console.log(this.time_coins, task.value)
    // console.log(`executed ${task.type}: ${this.time_coins}, value: ${task.value}`);
    const arr = TASK_LIST.map(result => result.amount_of_time);
    const max = Math.max(...arr);
    this.mappedAmountOfTime = map(_amount_of_time, 0, max + (max / 2), MINIMUM, MAXIMUM);
    this.wasBruteForced = brute_forced || false;



    this.updatePreferences(task, agents);

    // this.setInfo();
  }

  add_data_to_archive() {

    /**
     * the magic trick below let us to push the preferences
     * without copying the reference to the original array 
     */
    const insert = JSON.parse(JSON.stringify(this.preferences));// the trick
    this.data_point.preferences = insert;
    // this.data_point.executed_task = this.currentTask;
    this.data_point.time_coins = this.time_coins; // this maps the value to a better scale¿
    this.data_point.feel_like_doing = this.FLD;
    this.data_point.spending_hours = this.spending_hours;
    this.data_point.stress_level = this.stress;
    this.data_point.amount_of_time = this.mappedAmountOfTime;
    this.data_point.swapped = this.has_swapped;// === true ? this.swap_task  = '';
    this.data_point.brute_force = this.wasBruteForced;
    // inner_clock = this.inner_clock;
    this.data_point.parsed_clock = this.parsed_clock;
    this.data_point.decision = this.decision;


    // console.log(this.decision);
    this.preferenceArchive.push(this.data_point);
    this.memory.add_memory(this.data_point);
    if (this.preferenceArchive.length > DATA_POINTS) this.preferenceArchive.splice(0, 1);
    if (this.recordData) {
      this.data.push(this.data_point);
    }

  }

  updatePreferences(_task, agents) {
    /**
     * the preferences (skill & preference for a task) get updated
     * according on how often the same task has been done in a row
     * as often as the same task is done as much skill you gain
     * but you also get bored of the task therefore you lose preference
     * while skill and preference get updated the skill and preference of the
     * tasks that have not been executed  also get inversely updated 
     * a.k.a. you forget how to do a task
     */
    let lastPreferences = this.data_point.preferences;
    // let tasksCompleted = {};
    // let result = {};
    // let executedTask = this.preferenceArchive.map(result => result.executed_task);
    // console.log(executedTask); 
    /**
     * here we compute the skill of each single agent.
     * The skill in our model is a quantitative measure,
     * it looks how often the skill has been executed and compares it
     * with how often the other have executed the same task.
     * therefore the agent who has executed the task the most is the more 
     * skilled, and so on.
     */
    for (const task of TASK_LIST) {
      /**
       * here we compute the which agent has executed a task 
       * the most
       */
      let max = 0;
      for (const a of agents) {
        if (a.preferenceArchive.length > 0) {
          lastPreferences = a.preferenceArchive[a.preferenceArchive.length - 1].preferences;
          if (lastPreferences[task.type].completed > max) max = lastPreferences[task.type].completed;
        }
      }
      /**
       * here we check how often an agent has completed this task.type
       */

      if (task.type === _task.type) {
        // here we update the skill for the task the agent has executed
        let completed = this.data_point.preferences;
        let sum = max == 0 ? 0 : (completed[task.type].completed / max);
        // console.log(sum, this.forget_rate, sum - this.forget_rate);
        // we can include something else here on how to update the skill
        // this.preferences[task.type].skill_level += (sum - this.forget_rate) * this.step;

        // console.log(sum, sum * this.step, task.type, this.ID)
        this.preferences[task.type].skill_level += sum * this.step;

        this.preferences[task.type].skill_level = clamp(this.preferences[task.type].skill_level, MINIMUM, MAXIMUM);
      }
      this.preferences[task.type].forget_skill();
    }

    this.behavior_exp.update_task_preference(this, _task);
  }
  /**
   * updates the completed task preference by adding +1
   * @param {String} task_name 
   */
  updateCompletedTasks(task_name) {
    this.totalTaskCompleted++;
    let myObj = this.preferences;
    Object.keys(myObj).forEach(key => {
      if (myObj[key].task_name === task_name) {
        myObj[key].completed++;
      }
    });
  }

  updateFLD(agents, task, brute_forced) {// rename me: motivation
    /**
      * this algorithm looks how much the other agents have been 
      * working. If the others are working more than this agent then
      * his FLD decreases slower, if he is working more than it 
      * decreses faster.
      * it could be possible to introduce the concept of groups here where 
      * the agents looks only how the group performs
      */
    if (brute_forced) {
      // here we manage the decrease in FLD when the agents are forced to do a task
      this.FLD /= 2;

    } else {
      // here their normal behavior when executing a task
      let otherTasksCompleted = [];
      for (const agent of agents) {
        if (agent !== this) otherTasksCompleted.push(agent.totalTaskCompleted);
      }

      const max = Math.max(...otherTasksCompleted);// magic trick
      // let result = (this.totalTaskCompleted / (this.totalTaskCompletedByAgents / this.numberOfAgents));
      let result = Math.floor((this.totalTaskCompleted / max) * 5); // <= hard-coded value
      this.FLD -= result;

    }
    this.FLD = clamp(this.FLD, MINIMUM, MAXIMUM);
  }

  /**
   * @param {String} task_name 
   * @return the preferences of that specific task
   */
  getPreferences(task_name) {
    let result = {};
    let myObj = this.preferences;
    Object.keys(myObj).forEach(key => {
      if (myObj[key].task_name === task_name) {
        result = myObj[key];
      }
    });
    return result;
  }

  /**
   * @returns the preferred task of an agent
   */
  preferredTask() {
    let max = 0;
    let myObj = this.preferences;
    let result = ''
    Object.keys(myObj).forEach(key => {
      let pref = myObj[key].task_preference;
      let name = myObj[key].task_name;
      if (pref > max) {
        max = pref;
        result = name;
      }
    });
    return result;
  }
  /**
   * @returns the preferences as an array of 10 elements
   */
  getPreferencesAsObject() {
    let obj = {
      FLD: this.FLD,
      stress: this.stress,
      time_coins: this.time_coins,
      amount_of_time_task: this.mappedAmountOfTime,
      swapped: this.has_swapped,
      brute_force: this.wasBruteForced
    };
    // arr.push(this.FLD);
    // arr.push(this.time_coins);
    // arr.push(this.stress);
    // arr.push(this.mappedAmountOfTime);
    Object.keys(this.preferences).forEach(val => {
      let keys = Object.keys(this.preferences[val]);
      let objAttribute = this.preferences[val];
      keys.forEach(key => {
        if (key === 'skill_level' || key === 'task_preference') obj[key] = objAttribute[key];
      });
    });
    return obj;
  }
  /**
   * @param {Array} arr Array of task objects
   * @returns an Object with the preference for each task
   */
  makePreferences(arr) {
    const PREFERENCE_OFFSET = 30;

    let result = {};
    for (const el of arr) {
      let skill = Math.floor(randomMinMAx() / 2);
      // result[el.type] = {
      //   task_name: el.type,
      //   completed: 0, // how many times the task has been completed
      //   skill_level: skill,
      //   task_preference: this.calculatePreference(skill, PREFERENCE_OFFSET)
      // }
      result[el.type] = {
        task_name: el.type,
        completed: 0, // how many times the task has been completed
        skill_level: 0,
        task_preference: 0,
        forget_rate: (10 + Math.floor(Math.random() * 10)) / 100,
        forget_skill: () => {
          // console.log('forget rate ' + el.type + ' ' + result[el.type].forget_rate)
          // console.log('skill before ' + el.type + ' ' + result[el.type].skill_level);
          result[el.type].skill_level -= (result[el.type].forget_rate * this.step)
          result[el.type].skill_level = clamp(result[el.type].skill_level, MINIMUM, MAXIMUM);
          // console.log('skill after ' + el.type + ' ' + result[el.type].skill_level)
        }
      }
    }
    // console.log(result);
    return result;
  }

  /**
   * computes the preference based on skill and preference offset
   * @param {Number} skill 
   * @param {Number} offset 
   * @returns the result of the calculation
   */
  calculatePreference(skill, offset) {
    let result = 0;
    result = skill + (-offset + (Math.floor(Math.random() * offset * 2)));
    if (result < MINIMUM) result = MINIMUM;
    if (result > MAXIMUM) result = MAXIMUM
    return result;
  }
}

class Behavior {
  /**
   * how to transform the trading behaviors in numerals:
   * likeliness to do different task
   * likeliness to do the same task
   * likeliness to workaholicness 
   * likeliness to rest
   * the traits JSON Object 
   *   {
   *       curiosity:     [0, 1],
   *       perfectionism: [0, 1], // 
   *       endurance:    [0, 1], // endurance
   *       goodwill:    [0, 1]  // accumulate  
   *       planning: {Object}               
   *   }
   * @param {JSON} _traits is an object containing two values: tendency to rest over work and tendency to repeat same task over curiosity
   * @param {*} _agent 
   */
  constructor(_traits, _agent) {
    this.traits = _traits;
    this.agent = _agent;
    this.computed_traits = {
      curiosity: null,
      perfectionism: null,
      endurance: null,
      goodwill: null
    };
    this.result_traits = {
      curiosity: null,
      perfectionism: null,
      endurance: null,
      goodwill: null
    }
    this.planning = {
      plan: _traits.planning[0],
      distribution: _traits.planning[1]
    }
    // console.log(this.planning);
    // Object.keys(this.traits).forEach(key => {
    //   if(key !== 'trait'){
    //     this.computed_traits[key] = null;
    //   }
    // });
    // console.log(this.traits);
    let mx = 0;
    Object.keys(this.traits).forEach(key => {
      if (key !== 'trait' && key !== 'endurance' && key !== 'planning') {
        if (this.traits[key] >= mx) mx = this.traits[key];
      }
    });
    // console.log(mx)
    this.dominant_traits = [];
    Object.keys(this.traits).forEach(key => {
      if (key !== 'trait' && key !== 'endurance' && key !== 'planning') {
        if (this.traits[key] >= mx) this.dominant_traits.push(key);
      }
    });
    // console.log(this.dominant_traits);

  }
  /**
   * this method computes the three traits of the behavior and
   * returns whether the agent should take the task or choose another task
   * @param {Object} task 
   * @param {Object} agents 
   * @param {Object} agent 
   * @returns a boolean stating if he swapped or accepted the task
   */
  decide(task, agents, agent) {
    // console.log(agent.ID, this.dominant_traits)
    const task_name = task.type;
    const agent_archive = agent.preferenceArchive;

    this.compute_traits(agent_archive, task_name, agent, task, agents);;
    return this.compute_decision(agent, task);;
  }

  compute_traits(agent_archive, task_name, agent, task, agents) {
    this.computed_traits.curiosity = this.compute_curiosity(agent_archive, task_name);
    this.computed_traits.perfectionism = this.compute_perfectionism(agent, task_name);
    this.computed_traits.endurance = this.compute_endurance(agent, task, this.traits.endurance);
    this.computed_traits.goodwill = this.compute_goodwill(agent, agents, task);
    // console.log(this.computed_traits);
    // const sum = this.computed_traits.curiosity.value + this.computed_traits.perfectionism.value + this.computed_traits.endurance + this.computed_traits.goodwill.value;
    // console.log(`sum of traits: ${sum}`);
    this.result_traits = {
      curiosity: (this.computed_traits.curiosity.value * this.traits.curiosity),
      perfectionism: (this.computed_traits.perfectionism.value * this.traits.perfectionism),
      endurance: this.computed_traits.endurance,
      goodwill: (this.computed_traits.goodwill.value * this.traits.goodwill)
    };
  }

  compute_decision(agent, task) {
    // console.log('compute decision...');
    let result = false;
    let swap_value = 0;
    if (agent.spending_model) {
      Object.keys(this.result_traits).forEach(key => {
        if (key !== 'endurance' && key !== 'goodwill') {
          swap_value += this.result_traits[key];
        }
      });
    } else {
      Object.keys(this.result_traits).forEach(key => {
        if (key !== 'endurance') {
          swap_value += this.result_traits[key];
        }
      });
    }
    if (this.compute_resting(agent, task)) return true;
    // here the swapping happens
    if (swap_value > 0.5) { // make it a slider between 0.3 – 0.7
      // console.log('WORK')
      // add rest to the agent task archive
      result = false
    } else {
      // add rest to the agent task archive
      agent.push_to_decision_archive('swap');
      const swap_trait = random_arr_element(this.dominant_traits);
      // console.log('SWAP', swap_trait);
      // console.log(this, this.computed_traits[swap_trait])
      const swap_task = this.computed_traits[swap_trait].swap_task
      // console.log(`agent swaps for: ${swap_task}`);
      agent.assign_swapped_task(swap_task);
      result = true;
    }
    return result;
  }

  compute_resting(agent, task) {
    // console.log(agent);
    let result = false;
    // first we handle the case of resting therefore if endurance is lower than 0.3
    // if the agents endurance reaches a treshold
    // first we handle the case of the spending model
    if (agent.spending_model) {
      // first we need to get the archive of the decisions
      const decision_archive = agent.get_decision_archive()
      result = this.compute_decision_resting(decision_archive)
      if (result) {
        // if the agent is resting than he rests
        agent.push_to_decision_archive('rest');
        // console.log('agent resting...', agent.ID);
        agent.rest(task);
      }
      return result;
    } else if (this.computed_traits.endurance < 0.3) {


      // in here we handle the coins aspect
      // does the agent have enough money?
      if (agent.time_coins >= task.aot) {
        // add rest to the agent task archive
        agent.push_to_decision_archive('rest');
        //if the agent has enough time coins he rests and tells the task that he rests
        // console.log('agent resting...');
        agent.rest(task);
        result = true;
        return result;
      } else {
        // here we update the stress value
        agent.increase_stress()
        // the agent can't rest
        return false
      }
    } else {
      return false
    }
  }
  compute_decision_resting(decision_archive) {
    let result = false;
    const work_archive = decision_archive.filter(result => result.decision === 'work');
    let last_decision = null;
    let curr_month = 0;
    if (work_archive.length > 0) {
      last_decision = work_archive[work_archive.length - 1];
      curr_month = work_archive.filter(result => result.time.m === last_decision.time.m);
    }
    if (curr_month === undefined) console.log(curr_month);
    if (this.planning.plan === 'distributed') {
      // if the plan is distributed the agent should look at the past executions 
      // the tendency to rest will decrease by the distance
      if (last_decision === null) { result = false; }
      else if (last_decision.time.m !== this.agent.get_inner_clock().m) { result = false }
      else {
        const last_day = last_decision.time.d;
        const current_day = this.agent.get_inner_clock().d;
        const difference = current_day - last_day;
        const mult = Math.pow(2, difference)
        const probability = (100 - (difference * mult)) * 0.01;
        const test = Math.random();
        result = mult > probability ? true : false;
        // console.log(test, probability, result);
      }
    } else {
      result = this.compute_compact_resting(decision_archive)
    }
    return result
  }

  compute_compact_resting(decision_archive) {
    let result = false;
    // let period_of_month = undefined;
    const current_day = this.agent.get_inner_clock().d;
    const agent_compact_plan = this.planning.distribution;
    // console.log(agent_compact_plan);
    if (current_day >= 1 && current_day <= 10) {
      // begin

      result = (agent_compact_plan === 'begin')
    } else if (current_day >= 11 && current_day <= 20) {
      // middle
      result = (agent_compact_plan === 'middle')
    } else if (current_day >= 21 && current_day <= 30) {
      // end
      result = (agent_compact_plan === 'end')

    } else {
      // error handling
      console.error(`error: a month has less than ${current_day} days!!`);
    }
    // console.log({current_day, agent_compact_plan, result});
    // wwe need to return the inverse of the result 
    // so that the agent say no when the compact plan matches and yes when it does not match
    return !result;
  }

  /**
   * this methods computes the curiosity of the agent
   * it checks how often the task has been done and
   * returns a value between [0,1]
   * @param {Array} agent_archive the archive of the agent's preferences
   * @param {String} task_name the task the agent s requested to execute
   * @returns an object with the computed value between [0, 1] and a suggested task to swap
   */
  compute_curiosity(agent_archive, task_name) {
    if (agent_archive.length > 1) {
      let archive = agent_archive;
      /**
       * first we extract the last 10 tasks and how often have been executed
       */
      const task_execution = [];
      if (agent_archive.length < 10) {

        // console.log(result)
      } else {
        // use only the last ten tasks of the archive
      }

      if (agent_archive.length > 10) {
        archive = [];
        for (let i = agent_archive.length - 11; i < agent_archive.length - 1; i++) {
          // console.log(i)
          // console.log(agent_archive[i])
          archive.push(agent_archive[i]);
        }
      }

      // fill with the data in the archive
      const executed_tasks = archive.map(result => result.executed_task);
      // console.log(executed_tasks);
      // const result = {};
      for (const task of TASK_LIST) {
        let sum = 0;
        for (const exec_task of executed_tasks) {
          if (exec_task === task.type) sum++
        }
        // task_execution[task.type] = sum;
        task_execution.push({
          name: task.type,
          num: sum
        })
      }

      // than we get how often this task the agent has executed
      // console.log(task_execution);
      const this_task_execution = task_execution.filter(result => result.name === task_name)[0];
      // console.log(this_task_execution);
      // we compute the curiosity by getting the inversve percentage
      // between the execution of this task and the total of task executions
      // this returns a value between [0, 1] that tends to 1 when the task has been
      // executed less often
      const result = 1 - this_task_execution.num / archive.length;
      // console.log(result)
      // this method also returns a suggestion for a task to be executed in the case
      // the agent decides to swap for another task
      // first we look for the task with minimum value
      // we sort the array by execution
      task_execution.sort((a, b) => a.num - b.num);
      // console.log(task_execution)
      const len = Math.floor(task_execution.length / 2);
      const less_executed_tasks = [];
      for (let i = 0; i < len; i++)less_executed_tasks.push(task_execution[i].name)
      // console.log(less_executed_tasks);
      // console.log(task_execution, this_task_execution, result);
      return {
        value: result,
        swap_task: random_arr_element(less_executed_tasks)
      };
    } else {
      // if we don't have enough data we just return 1
      return {
        value: 1,
        swap_task: task_name
      };
    }
  }
  /**
   * @param {Object} agent
   * @param {String} task_name
   * @returns an object with the computed value between [0, 1] and a suggested task to swap
   */
  compute_perfectionism(agent, task_name) {
    const result = {
      value: 0,
      swap_task: ''
    }
    if (agent.masterTask === task_name) {
      // console.log(agent)
      // if it is a match we return the max value 1
      result.value = 1;
      result.swap_task = task_name;
      return result;
    } else {
      // else we return the skill level in the range of [0, 1]
      // and we suggest the master task as swap task
      const val = agent.preferences[task_name]['skill_level'] / MAXIMUM;
      result.value = val;
      result.swap_task = agent.masterTask;
      return result;
    };
  }
  /**
   * this method computes the endurance of agent.
   * it is computed by looking at his wealth aka time coins
   * and compares it to the amount of time needed to complete the task
   * as this difference grows bigger the agent become less resilient. It also
   * takes in account its preference for that task the higher it is the more
   * resilient the agent will be.
   * maybe it should grow on top of FLD
   * @param {Object} agent 
   * @param {String} task_aot
   * @returns the endurance as avalue between [0, 1]
   */
  compute_endurance(agent, task, input_val) {
    const divider = agent.time_coins == 0 ? 1 : agent.time_coins;
    let perc_wealth = task.aot / divider;
    if (perc_wealth >= 1) perc_wealth = 1;
    // here we compute the preference for the task as value between [0,1]
    const perc_preference = agent.preferences[task.type].task_preference / MAXIMUM;
    /**
     * here we do a nudged median that gives preference 
     * advantage over wealth
     */

    const nudge = () => { // this should be available for other methods too...!
      if (perc_preference > perc_wealth) {
        return (perc_preference - perc_wealth) / 4
      } else return 0;
    };
    // than we sum them up and divide by 2 to get a median value
    // console.log(nudge())
    const tot_perc = ((perc_preference + perc_wealth) / 2) + nudge();
    // console.log(((input_val - 0.5) * 10) * tot_perc);
    const compute_input_tot = (((input_val - 0.5) * 10) * tot_perc) / MAXIMUM; // needs refactoring
    /**
     * we compute endurance on top of FLD therefore
     * we add the result between the input value, 
     * wealth and preference.
     */
    const top_fld = (MAXIMUM - agent.FLD) / MAXIMUM;
    const curr_fld = agent.FLD / MAXIMUM;
    const result = curr_fld + compute_input_tot;
    // const log = `
    // pref: ${perc_preference}\n
    // wealth: ${perc_wealth}\n
    // tot: ${tot_perc}\n
    // topfld: ${top_fld}\n
    // curr fld: ${curr_fld}\n
    // result curr: ${curr_fld * tot_perc}\n
    // result nofld: ${top_fld * tot_perc}\n
    // result curr: ${(curr_fld * tot_perc) + curr_fld}\n
    // result top: ${result}`
    // // console.log(log)
    if (result >= 1) return 1
    else if (result <= 0) return 0
    else return result;
  }
  /**
   * this methods computes the likeliness to choose a more renumerative
   * task rather than the assigned one. it takes in consideration the value of all the
   * tasks and compares it with the assigned task and returns a value and a preferred task
   * in case he wants to trade
   * @param {Object} agent the agent from the parent class
   * @param {Array} agents the pool of all agents
   * @param {Object} _task a task object
   * @returns an object with the computed value between [0, 1] and a suggested task to swap
   */
  compute_goodwill(agent, agents, _task) {
    // console.log(_task.value);
    const task_values = {}
    for (const task of TASK_LIST) {
      if (task.type !== _task.type) task_values[task.type] = agent.taskValue(agents, task.type) * task.amount_of_time;
    }
    task_values[_task.type] = _task.value
    // we compute the max
    let max = {
      name: '',
      value: 0
    }
    Object.keys(task_values).forEach(key => {
      if (task_values[key] >= max.value) {
        max.value = task_values[key];
        max.name = key
      }
    })
    // console.log(_task.type, task_values, max, _task.value / max.value);
    // here we see how our task does compared to the max one
    const result = {
      value: isNaN(_task.value / max.value) ? 0 : _task.value / max.value, // we avoid 0/0 giving NaN
      swap_task: max.name
    }
    // console.log(result)
    return result;
  }

  /**
   * to compute the preference for a task we look on how the task scored the
   * in the different traits areas. Than we take the one where it socred the higher
   * and we subtract the two who scored the worst  ad and we compute the sign [+, 0, -]
   * than we use the sign to add or remove value to the preference for that task.
   * this system has the advantage of being a more general way to update preference for a task,
   * as it take in consideration the fact that agents may prefer a task that doesn't
   * score good with the dominant trait, but that nevertheless has scored good with
   * the other traits, this could also be used to alter the traits, making the traits more dynamic
   * @param {Object} agent 
   * @param {Array} agents 
   * @param {Object} task 
   */
  update_task_preference(agent, task) {
    const curiosity = this.result_traits.curiosity;
    const perfectionism = this.result_traits.perfectionism;
    const goodwill = this.result_traits.goodwill;
    const endurance = this.result_traits.endurance;
    // console.log(curiosity, perfectionism, goodwill);
    const results = [curiosity, perfectionism, goodwill].sort();
    // console.log(results);
    const agent_pref = agent.preferences[task.type];
    const skill = agent_pref.skill_level / MAXIMUM;
    const skill_sum = skill > 0.5 ? skill : -(skill);
    const sum = Math.abs(results[2] - (results[0] + results[1])) > 0.5 ? 1 : -1;
    const agent_fld = (agent.FLD / MAXIMUM) - 0.5;
    agent_pref.task_preference += sum * endurance * skill_sum;// this 25 is here to make the gain and drop in preference more marked
    agent_pref.task_preference = clamp(agent_pref.task_preference, MINIMUM, MAXIMUM);
  }
  setType(_traits) {
    this.traits = _traits;
  }
  get_endurance() {
    return this.computed_traits.endurance;
  }
}

class Memory {
  constructor(memory) {
    // console.log(memory);
    this.memory = {};
    // make memory blueprint
    Object.keys(memory).forEach(key => {
      const data = memory[key];
      if (typeof data === 'number' || typeof data === 'boolean') {
        this.memory[key] = [];
      } else if (key === 'preferences') {
        Object.keys(data).forEach(task => {
          const preferences = data[task];
          Object.keys(preferences).forEach(inner_key => {
            const inner_el = preferences[inner_key];
            if (typeof inner_el === 'number' && inner_key !== 'completed' && inner_key !== 'forget_rate') {
              this.memory[task + '_' + inner_key] = [];
            }
          })
        })
      } else {
        this.memory[key] = [];
      }
    })
  }

  add_memory(memory) {
    Object.keys(memory).forEach(key => {
      const data = memory[key];
      if (key === 'preferences') {
        Object.keys(data).forEach(task => {
          const preferences = data[task];
          Object.keys(preferences).forEach(inner_key => {
            const index = this.get_index(task + '_' + inner_key);
            const inner_el = preferences[inner_key];
            if (index !== null) this.memory[index].push(inner_el)
          })
        })
      } else {
        const index = this.get_index(key);
        if (index !== null) this.memory[index].push(data);

      }
    })

    // // we need to update the slider in the index.html
    // const array_name = Object.keys(this.memory)[0];
    // const array_length = this.memory[array_name].length;
    // const time_slider = document.getElementById('time-slider')
    // time_slider.setAttribute('max', array_length);
  }
  get_index(key) {
    let index = null;
    Object.keys(this.memory).forEach(item => {
      if (item === key) {
        index = key;
      }
    })
    return index;
  }
  get_memories(filter) {
    if (typeof filter === 'string') return this.memory;
    else return this.filter_memories(filter)
  }

  filter_memories(filter) {
    const result = {};
    const slice = 20;

    let begin = filter - slice;
    let end = filter;

    if (filter <= slice) begin = filter + slice;

    Object.keys(this.memory).forEach(key => {
      result[key] = this.memory[key].slice(0, end);
    })

    const last_idx = result.parsed_clock.length - 1;
    const last_date = result.parsed_clock[last_idx];

    const h = last_date.getHours();
    const d = last_date.getDate();
    const m = last_date.getMonth() + 1;
    const y = last_date.getFullYear();

    const current_year = new Date().getFullYear();

    set_date(y - current_year, m, d, h);

    return result
  }
}

class PostMessage {
  constructor(title) {
    this.enabled = false;
    this.content = {
      title: title,
      body: {}
    }
  }
  enable() {
    this.enabled = true;
  }
  set_message(obj) {
    this.content.body = obj;
  }

  post_message(msg, emoji, tooltip_txt, css_class) {
    if (this.enabled) {
      const container = document.querySelector('.push-container');
      const div = document.createElement('div');
      div.setAttribute('class', 'push box ' + css_class);
      div.setAttribute('data-title', tooltip_txt);
      div.textContent = this.content.title + '\n'+ msg;

      const span = document.createElement('span')
      span.setAttribute('class', 'big-text');
      span.textContent = emoji;

      div.appendChild(span)
      container.appendChild(div);

      container.scrollTop = container.scrollHeight;
      // console.log(container.children.length);
      // if(container.children.length > 100){
      //   container.removeChild(container.children[0]);
      // }
    }
  }
}

