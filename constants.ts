
import { AppState, TaskCategory } from './types';

export const INITIAL_STATE: AppState = {
  userRole: 'student',
  tasks: [
    { 
      id: '1', 
      title: 'Morning Revision (Physics)', 
      category: TaskCategory.STUDY,
      priority: 'High',
      completed: true, 
      startTime: '06:00', 
      duration: 120,
      createdBy: 'user',
      deadline: new Date().toISOString()
    },
    { 
      id: '2', 
      title: 'Complete HC Verma Ch 3', 
      category: TaskCategory.STUDY, 
      priority: 'High',
      completed: false, 
      startTime: '09:00', 
      duration: 360,
      createdBy: 'admin',
      description: 'Focus on rotational inertia problems.',
      deadline: new Date(Date.now() - 3600000).toISOString() // 1 hour ago (Overdue for demo)
    },
    { 
      id: '3', 
      title: 'Power Nap', 
      category: TaskCategory.SLEEP, 
      priority: 'Medium',
      completed: false, 
      startTime: '16:00', 
      duration: 45,
      createdBy: 'user'
    },
    { 
      id: '4', 
      title: 'Evening Problem Solving', 
      category: TaskCategory.STUDY, 
      priority: 'High',
      completed: false, 
      startTime: '17:00', 
      duration: 180,
      createdBy: 'user'
    },
    { 
      id: '5', 
      title: 'Dinner & Relax', 
      category: TaskCategory.FUN, 
      priority: 'Low',
      completed: false, 
      startTime: '20:30', 
      duration: 60,
      createdBy: 'user'
    },
  ],
  subjects: [
    {
      id: 'phy',
      name: 'Physics',
      chapters: [
        { 
          id: 'p1', 
          name: 'Kinematics', 
          grade: '11th', 
          topicsTotal: 10, 
          topicsCovered: 10, 
          questionsSolved: 150, 
          isCompleted: true,
          resources: [
            { id: 'r1', title: 'Kinematics Formula Sheet', type: 'formula', url: '#' },
            { id: 'r2', title: 'HC Verma Solutions', type: 'note', url: '#' },
            { id: 'r3', title: 'One Shot Video', type: 'video', url: '#' }
          ]
        },
        { 
          id: 'p2', 
          name: 'Rotational Motion', 
          grade: '11th', 
          topicsTotal: 15, 
          topicsCovered: 8, 
          questionsSolved: 60, 
          isCompleted: false,
          resources: []
        },
        { 
          id: 'p3', 
          name: 'Electrostatics', 
          grade: '12th', 
          topicsTotal: 12, 
          topicsCovered: 2, 
          questionsSolved: 20, 
          isCompleted: false,
          resources: []
        },
      ],
      practiceTests: [
        {
          id: 'pt1',
          title: 'Kinematics Unit Test',
          url: '#',
          difficulty: 'Medium',
          totalMarks: 100,
          score: 85,
          feedback: 'Good work on projectile motion. Revise relative velocity.',
          dateAdded: '2023-10-15'
        }
      ]
    },
    {
      id: 'chem',
      name: 'Chemistry',
      chapters: [
        { 
          id: 'c1', 
          name: 'Chemical Bonding', 
          grade: '11th', 
          topicsTotal: 8, 
          topicsCovered: 8, 
          questionsSolved: 120, 
          isCompleted: true,
          resources: []
        },
        { 
          id: 'c2', 
          name: 'Thermodynamics', 
          grade: '11th', 
          topicsTotal: 10, 
          topicsCovered: 5, 
          questionsSolved: 45, 
          isCompleted: false,
          resources: []
        },
        { 
          id: 'c3', 
          name: 'Organic Basics', 
          grade: '11th', 
          topicsTotal: 14, 
          topicsCovered: 0, 
          questionsSolved: 0, 
          isCompleted: false,
          resources: []
        },
      ],
      practiceTests: []
    },
    {
      id: 'math',
      name: 'Mathematics',
      chapters: [
        { 
          id: 'm1', 
          name: 'Quadratic Equations', 
          grade: '11th', 
          topicsTotal: 6, 
          topicsCovered: 6, 
          questionsSolved: 100, 
          isCompleted: true,
          resources: []
        },
        { 
          id: 'm2', 
          name: 'Calculus (Limits)', 
          grade: '12th', 
          topicsTotal: 20, 
          topicsCovered: 5, 
          questionsSolved: 30, 
          isCompleted: false,
          resources: []
        },
      ],
      practiceTests: [
        {
          id: 'pt2',
          title: 'Calculus Daily Drill',
          url: '#',
          difficulty: 'Hard',
          totalMarks: 50,
          dateAdded: '2023-10-20'
        }
      ]
    }
  ],
  transactions: [
    { id: 't1', amount: 2000, type: 'income', category: 'Pocket Money', date: '2023-10-01', description: 'Monthly allowance' },
    { id: 't2', amount: 500, type: 'expense', category: 'Books', date: '2023-10-05', description: 'HC Verma Vol 2' },
    { id: 't3', amount: 150, type: 'expense', category: 'Food', date: '2023-10-10', description: 'Snacks' },
  ],
  events: [
    { id: 'e1', title: 'JEE Mock Test 1', date: '2023-10-25', type: 'exam', color: '#ef4444' },
    { id: 'e2', title: 'Physics Extra Class', date: '2023-10-20', type: 'class', color: '#3b82f6' },
  ],
  motivationResources: [
    { 
      id: 'v1', 
      title: 'How to crack JEE Advanced', 
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
      thumbnail: 'https://picsum.photos/300/180?random=1',
      type: 'long',
      isWatched: false
    },
    { 
      id: 'v2', 
      title: 'Physics: Rotational Dynamics One Shot', 
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
      thumbnail: 'https://picsum.photos/300/180?random=2',
      type: 'long',
      isWatched: false
    },
    {
      id: 's1',
      title: 'Study Hard!',
      url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      thumbnail: 'https://picsum.photos/150/260?random=10',
      type: 'short',
      isWatched: false
    }
  ],
  streak: {
    currentStreak: 0,
    lastInterviewDate: null,
    maxStreak: 0,
    history: []
  },
  trackingConsent: 'pending',
  activityLog: []
};

export const STREAK_BREAK_MESSAGES = [
  "IIT is Moving Away from You because what you did to me Yesterday. 💔",
  "काल अभ्यास नाही केलास? स्वप्न धूसर होत आहेत मित्रा! (You didn't study yesterday? Dreams are fading friend!)",
  "Consistency is key, and you just lost the key. Start again.",
  "एक दिन की लापरवाही, एक रैंक नीचे। (One day of carelessness, one rank down.)",
  "The competition didn't rest yesterday. You did. Wake up!",
  "IIT Bombay गेटवर तुला अडवतील जर असं वागलास तर! (They will stop you at IIT Bombay gate if you behave like this!)",
  "Every broken streak is a broken promise to your parents."
];

export const MOTIVATIONAL_QUOTES = [
  // --- English ---
  "Dream big. Work hard. Stay humble.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "You don't have to be great to start, but you have to start to be great.",
  "IIT is not just a college, it's an emotion.",
  "Pain is temporary. Pride is forever.",
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "It always seems impossible until it's done.",
  "Start where you are. Use what you have. Do what you can.",
  "Push yourself, because no one else is going to do it for you.",
  "Your limitation—it's only your imagination.",
  "Great things never came from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Stay focused and never give up.",
  "Do something today that your future self will thank you for.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Little things make big days.",
  
  // --- Hindi ---
  "कोशिश करने वालों की कभी हार नहीं होती।",
  "सपने वो नहीं जो हम सोते वक्त देखते हैं, सपने वो हैं जो हमें सोने नहीं देते।",
  "मंजिलें उन्हीं को मिलती हैं, जिनके सपनों में जान होती है।",
  "सफलता हमारा परिचय दुनिया को करवाती है और असफलता हमें दुनिया का परिचय करवाती है।",
  "जो अपने कदमों की काबिलियत पर विश्वास रखते हैं, वो ही अक्सर मंजिल पर पहुँचते हैं।",
  "अगर आप हार नहीं मानते, तो आपको कोई नहीं हरा सकता।",
  "कड़ी मेहनत आपको वहां पहुंचा देती है जहां अच्छी किस्मत शायद आपको पहुंचा दे।",
  "समय और शिक्षा का सही उपयोग ही व्यक्ति को सफल बना देता है।",
  "विद्यार्थी जीवन में छोटी-छोटी आदतें ही हमारे जीवन में बड़ा फर्क पैदा कर देती हैं।",
  "सपनों को सच करने से पहले सपनों को ध्यान से देखना होता है।",
  "खुद वो बदलाव बनिए जो आप दुनिया में देखना चाहते हैं।",
  "संघर्ष इंसान को मजबूत बनाता है, फिर चाहे वो कितना भी कमजोर क्यों न हो।",
  "जिसने कभी गलती नहीं की, उसने कभी कुछ नया करने की कोशिश नहीं की।",
  "जितना कठिन संघर्ष होगा, जीत उतनी ही शानदार होगी।",
  "अपने लक्ष्य पर नजर और अपनी मेहनत पर विश्वास रखो।",
  "मेहनत इतनी खामोशी से करो कि सफलता शोर मचा दे।",
  "वक्त आपका है, चाहे तो सोना बना लो, चाहे तो सोने में गुजार दो।",
  
  // --- Marathi ---
  "प्रयत्नांती परमेश्वर.",
  "केल्याने होत आहे रे आधी केलेची पाहिजे.",
  "यशाचा मार्ग सोपा नसतो, पण तो अशक्यही नसतो.",
  "नशिबावर विश्वास ठेवण्यापेक्षा स्वतःच्या मनगटावर विश्वास ठेवा.",
  "स्वप्न ती नाहीत जी झोपल्यावर पडतात, स्वप्न ती आहेत जी तुम्हाला झोपू देत नाहीत.",
  "ज्याला हरण्याची भीती वाटते, तो कधीच जिंकू शकत नाही.",
  "अपयश ही यशाची पहिली पायरी आहे.",
  "माणसाने नेहमी समुद्रासारखं असावं, कोणालाही न समजणारं आणि सर्वांना सामावून घेणारं.",
  "शिक्षण हे वाघिणीचे दूध आहे, जो पेईल तो गुरगुरल्याशिवाय राहणार नाही.",
  "कामात आनंद शोधला की कामाचे ओझे वाटत नाही.",
  "जिंकण्याची मजा तेव्हाच येते जेव्हा सर्वजण तुमच्या हरण्याची वाट पाहत असतात.",
  "संकटांवर अशा प्रकारे तुटून पडा की जिंकलो तरी इतिहास आणि हरलो तरी इतिहासच झाला पाहिजे.",
  "आयुष्य छान आहे, थोडं लहान आहे, पण रडुन काय होणार आहे.",
  "स्वतःच्या अस्तित्वासाठी स्वतःच लढावं लागतं.",
  "थांबू नका, कारण वेळ कोणासाठीच थांबत नाही.",
  "मोठी स्वप्ने पाहणाऱ्यांच्याच डोळ्यात मोठी झेप घेण्याची ताकद असते.",
  "यशस्वी व्हायचं असेल तर अपयशाची भीती बाळगू नका."
];
