/**
 * Change the TIME_SCALE variable to change the speed of the 
 * model 
 * 
 * increase the value to make model slower
 */
const TIME_SCALE = 1; // each time unit is equivalent to 10 minutes 

const TS_FRACTION = 1;
const DAY = 24 * TIME_SCALE * TS_FRACTION;// 1 day
const MAXIMUM = 100; // we need this to clamp values for preferences
const MINIMUM = 1;
const DATA_POINTS = 300;
// animation const
const TEXT_SIZE = 20;
const LEFT_GUTTER = 80;
const PADDING = 30;
const COL = 10;
const ROWS = 5;
const COL_HEIGHT = innerHeight - 100;
const INFO_HEIGHT = 55;


let AGENT_NUM = 10;
// make our tasks

const AGENT_PARAMS = [
  'time_coins',
  'feel_like_doing',
  'spending_hours',
  'stress_level',
  'amount_of_time',
  'swapped',
  'brute_force'
];

const DECISIONS = [
  'work',
  'swap',
  'rest',
  'brute-forced'
]

const PARAMS_COLORS = {
  skill: '#0f0',
  preference: '#f0f',
  time_coins: '#f00',
  feel_like_doing: '#0ff',
  spending_hours: '#fc0',
  stress_level: '#ff0',
  amount_of_time: '#0bf',
  swapped: '#0f6',
  brute_force: '#f60'
};

const TASK_NAMES = [
  'food_dept_mngmt',
  'kitchen_maintenance',
  'social_work',
  'facility_duties',
],

to_emoji = {
  skill: '🤸🏻‍♀️',
  preference: '🥰',
  fld: '🙇🏻‍♀️',
  time_coins: '💵',
  time_coins_real: '💰',
  spending_hours: '💸',
  stress: '😰',
  aot: '⏳',
  swapped: '🔄',
  rest: '💆🏻',
  brute_forced: '💪🏻',
  food_dept_mngmt: '🍱',
  kitchen_maintenance: '👩🏻‍🍳',
  social_work: '👨‍👧‍👦',
  facility_duties: '⚙️',
  curious: '🔎',
  perfectionist: '🔭',
  lazy: '🚴🏻',
  goodwiller: '🛠'
}

// and a list out of them
let TASK_LIST = [
  makeTask(2 * TIME_SCALE, 3, TASK_NAMES[0]),
  makeTask(2 * TIME_SCALE, 4, TASK_NAMES[1]),
  makeTask(3 * TIME_SCALE, 1, TASK_NAMES[2]),
  makeTask(2 * TIME_SCALE, 2, TASK_NAMES[3]),
];
// agent states 
const AGENT_BEHAVIORS = [
  'curious',
  'perfectionist',
  'lazy',
  'goodwiller'
]
const AGENT_TRAITS = [
  {
    trait: 'curious',
    curiosity: 1.0,
    perfectionism: 0,
    endurance: 0.5,
    goodwill: 0
  },
  {
    trait: 'perfectionist',
    curiosity: 0,
    perfectionism: 1.0,
    endurance: 0.7,
    goodwill: 0
  },
  {
    trait: 'lazy',
    curiosity: 1.0,
    perfectionism: 0,
    endurance: 0.2,
    goodwill: 0
  },
  {
    trait: 'goodwiller',
    curiosity: 0.1,
    perfectionism: 0,
    endurance: 0.8,
    goodwill: 1.0
  },
]

const communities_configs = [
  {
    name: 'community 1',
    traits_list: {
      type_1: {
        config: {
          trait: 'curious',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.5,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_2: {
        config: {
          trait: 'perfectionist',
          curiosity: 0,
          perfectionism: 1.0,
          endurance: 0.7,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_3: {
        config: {
          trait: 'lazy',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.2,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_4: {
        config: {
          trait: 'goodwiller',
          curiosity: 0.1,
          perfectionism: 0,
          endurance: 0.8,
          goodwill: 1.0,
          planning: ['distributed', 'begin']
        },
        amount: 4
      }
    },
    min_wage: 1,
    task_num: 1,
    model_type: 'time-accumulate',
    monthly_hours: 30
  },
  {
    name: 'community 2',
    traits_list: {
      type_1: {
        config: {
          trait: 'curious',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.5,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_2: {
        config: {
          trait: 'perfectionist',
          curiosity: 0,
          perfectionism: 1.0,
          endurance: 0.7,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_3: {
        config: {
          trait: 'lazy',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.2,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_4: {
        config: {
          trait: 'goodwiller',
          curiosity: 0.1,
          perfectionism: 0,
          endurance: 0.8,
          goodwill: 1.0,
          planning: ['distributed', 'begin']
        },
        amount: 4
      }
    },
    min_wage: 1,
    task_num: 1,
    model_type: 'time-spending',
    monthly_hours: 25
  },
  {
    name: 'community 3',
    traits_list: {
      type_1: {
        config: {
          trait: 'curious',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.5,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_2: {
        config: {
          trait: 'perfectionist',
          curiosity: 0,
          perfectionism: 1.0,
          endurance: 0.7,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_3: {
        config: {
          trait: 'lazy',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.2,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_4: {
        config: {
          trait: 'goodwiller',
          curiosity: 0.1,
          perfectionism: 0,
          endurance: 0.8,
          goodwill: 1.0,
          planning: ['distributed', 'begin']
        },
        amount: 4
      }
    },
    min_wage: 3,
    task_num: 2,
    model_type: 'time-accumulate',
    monthly_hours: 30
  },
  {
    name: 'community 4',
    traits_list: {
      type_1: {
        config: {
          trait: 'curious',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.5,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_2: {
        config: {
          trait: 'perfectionist',
          curiosity: 0,
          perfectionism: 1.0,
          endurance: 0.7,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_3: {
        config: {
          trait: 'lazy',
          curiosity: 1.0,
          perfectionism: 0,
          endurance: 0.2,
          goodwill: 0,
          planning: ['compact', 'end']
        },
        amount: 4
      },
      type_4: {
        config: {
          trait: 'goodwiller',
          curiosity: 0.1,
          perfectionism: 0,
          endurance: 0.8,
          goodwill: 1.0,
          planning: ['distributed', 'begin']
        },
        amount: 4
      }
    },
    min_wage: 1,
    task_num: 2,
    model_type: 'time-spending',
    monthly_hours: 15
  }
]

