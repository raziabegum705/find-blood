
// SAMPLE DATA - replace with MongoDB/API responses
const CENTER = {lat:14.6819, lng:77.6006}; // Anantapur

// ---- BLOOD BANKS: add your own rows here (copy one line and change it) ----
// phone: '' shows "Phone not listed". Use a real number only if you have one.
const BANKS = [
 {name:"Govt General Hospital Blood Bank, Anantapur",type:"Government",units:18,lat:14.6800,lng:77.6000,phone:""},
 {name:"Sri Sathya Sai Blood Centre, Puttaparthi",type:"Charitable/Vol",units:38,lat:14.1650,lng:77.8110,phone:""},
 {name:"Area Hospital Blood Bank, Gooty",type:"Government",units:9,lat:15.1220,lng:77.6330,phone:""},
 {name:"Govt Blood Bank, Hindupur",type:"Government",units:12,lat:13.8283,lng:77.4910,phone:""},
 {name:"Karunya Blood Centre, Kurnool",type:"Private",units:45,lat:15.8281,lng:78.0373,phone:""}
];

const DONORS = [
 {name:"Mahesh Sharma",group:"B+",km:1.2,eta:"3 min",lastDonatedDays:140},
 {name:"Hari",group:"O+",km:1.4,eta:"3 min",lastDonatedDays:200},
 {name:"Venkat Shaik",group:"B+",km:1.8,eta:"4 min",lastDonatedDays:120},
 {name:"Anitha Rao",group:"A+",km:2.9,eta:"7 min",lastDonatedDays:180},
 {name:"Sravani",group:"O+",km:3.0,eta:"7 min",lastDonatedDays:250},
 {name:"Imran",group:"O-",km:4.0,eta:"10 min",lastDonatedDays:95},
 {name:"Fatima Begum",group:"AB+",km:4.4,eta:"11 min",lastDonatedDays:160},
 {name:"Divya Reddy",group:"A-",km:5.1,eta:"12 min",lastDonatedDays:300},
 {name:"Suresh Babu",group:"B-",km:5.8,eta:"14 min",lastDonatedDays:210},
 {name:"Ravi Kumar",group:"AB-",km:6.5,eta:"15 min",lastDonatedDays:130}
];

const REQUEST = {group:"B+",units:2,hospital:"Government Hospital, Anantapur",patient:"Rama",reason:"Car accident"};

const I18N = {
 EN:{hero:"Need blood right now?",sub:"Snap a slip or send a voice note. We'll handle the rest.",cta:"Find Blood Now"},
 TE:{hero:"ఇప్పుడే రక్తం కావాలా?",sub:"స్లిప్ ఫోటో తీయండి లేదా వాయిస్ నోట్ పంపండి. మిగతాది మేము చూసుకుంటాం.",cta:"ఇప్పుడే రక్తం వెతకండి"},
 HI:{hero:"अभी खून चाहिए?",sub:"पर्ची की फोटो लें या वॉइस नोट भेजें। बाकी हम संभालेंगे।",cta:"अभी खून खोजें"}
};

// ---- DUMMY BLOOD CAMPS: edit or add your own rows here ----
// day(3) means "3 days from today", so the camps stay upcoming.
// You can also write a fixed date like date:'2026-11-20'.
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const CAMPS = [
 {name:"NSS Mega Blood Donation Camp",organizer:"Gates Institute of Technology NSS Unit",date:day(3),time:"9:00 AM - 4:00 PM",place:"Gates Institute of Technology, Gooty",phone:""},
 {name:"Red Cross Voluntary Blood Drive",organizer:"Indian Red Cross Society, Anantapur",date:day(6),time:"10:00 AM - 3:00 PM",place:"Government General Hospital, Anantapur",phone:""},
 {name:"Lions Club Blood Donation Camp",organizer:"Lions Club of Gooty",date:day(10),time:"9:30 AM - 1:30 PM",place:"Community Hall, Gooty",phone:""},
 {name:"Rotary Blood Camp",organizer:"Rotary Club of Kurnool",date:day(14),time:"9:00 AM - 2:00 PM",place:"Rotary Bhavan, Kurnool",phone:""},
 {name:"Sri Sathya Sai Blood Donation Day",organizer:"Sri Sathya Sai Blood Centre",date:day(20),time:"8:00 AM - 12:00 PM",place:"Puttaparthi",phone:""}
];