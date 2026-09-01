// Sam's Glitched Cafe — data-driven story definition.
// Pure data + tiny predicate functions. No engine logic lives here.

export const CHARACTERS = {
  yasmin: { name: 'יסמין', color: '#7ec8ff' },
  sam: { name: 'סאם', color: '#ff3fb0' },
  static: { name: '???', color: '#39ff88' },
  customer: { name: 'הלקוח', color: '#a58bff' },
};

export const STORY = {
  start: 'intro',
  scenes: {

    intro: {
      bg: 'street',
      dialogue: [
        { text: 'גשם דק נוקש על השלט הכחול-ורוד שמהבהב מעל דלת עץ ישנה: "קפה גליץ\'".' },
        { text: 'השלט מדלג על אות באמצע השם כל כמה שניות, כאילו הוא לא בטוח מה שמו.' },
        { text: 'יסמין נעצרת מולו לרגע, מנערת את המטריה, ונכנסת פנימה להימלט מהגשם.' },
      ],
      next: 'enter_cafe',
    },

    enter_cafe: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { text: 'פעמון קטן מצלצל. בתוך המקום חמים ושקט, ריח קפה שרוף-מתוק תלוי באוויר.' },
        { speaker: 'sam', emotion: 'smile', text: 'ערב טוב! שולחן, ברקיע, מיטה? יש לנו הכל חוץ מ… רגע, יש לנו רק קפה. שבי בבקשה.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'קפה יספיק לי מצוין, תודה.' },
      ],
      next: 'meet_glitch',
    },

    meet_glitch: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { speaker: 'sam', emotion: 'glitch', vfx: 'glitch', text: 'אז— אז— אז— מה תרצ//י להזמ//ין הער_ב?' },
        { speaker: 'sam', emotion: 'shock', text: 'סליחה. זה… זה קורה לפעמים. תתעלמי.' },
      ],
      next: 'choice_1',
    },

    choice_1: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { speaker: 'sam', emotion: 'sad', text: 'רוב האנשים פשוט מזמינים ובורחים כשזה קורה.' },
      ],
      choices: [
        { text: '"את בסדר?"', effects: { affection: 2 }, next: 'order_kind' },
        { text: '"קפה שחור, בבקשה."', effects: { rage: 1 }, next: 'order_neutral' },
        { text: '"מגניב, את מקוטעת."', effects: { rage: 2, affection: -1 }, next: 'order_mock' },
      ],
    },

    order_kind: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { speaker: 'yasmin', emotion: 'smile', text: 'את בסדר?' },
        { speaker: 'sam', emotion: 'smile', text: 'זו… השאלה הכי טובה ששאלו אותי כאן. הרבה זמן.' },
        { speaker: 'sam', text: 'קפוצ\'ינו? אני מבטיחה שהקצף לא ינסה לתקוף אותך. בדרך כלל.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'אני אסתכן.' },
      ],
      next: 'first_reveal',
    },

    order_neutral: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { speaker: 'yasmin', text: 'קפה שחור, בבקשה.' },
        { speaker: 'sam', emotion: 'neutral', text: 'קפה שחור. פשוט. אני מכבדת את זה.' },
      ],
      next: 'first_reveal',
    },

    order_mock: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'angry' },
      ],
      dialogue: [
        { speaker: 'yasmin', emotion: 'smile', text: 'מגניב. את מקוטעת.' },
        { speaker: 'sam', emotion: 'angry', vfx: 'shake', text: 'כן. מצחיק מאוד. תרצי את הקפה שלך רותח, או שאת מעדיפה שאני אזרוק אותו עלייך?' },
      ],
      next: 'first_reveal',
    },

    first_reveal: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { text: 'סאם מניחה כוס על השולחן. הידיים שלה רועדות לרגע — ואז נעצרות, כאילו הזמן דילג פריים.' },
        { speaker: 'sam', emotion: 'sad', vfx: 'glitch', text: 'תשמעי… כל ערב אני פותחת את המקום הזה מחדש. ולא זוכרת את האתמול. אף פעם.' },
        { speaker: 'yasmin', emotion: 'shock', text: 'מה זאת אומרת "נפתח מחדש"? סאם, את נשמעת רצינית.' },
        { text: 'היא מצביעה בשקט לעבר הפינה, שם לקוח יושב לבדו ומרים מזלג לפה — שוב, ושוב, באותה תזוזה בדיוק.' },
        { speaker: 'sam', text: 'תראי אותו. הוא לא זז משם אף פעם. אותו ביס, אותה שנייה, כל לילה מחדש.' },
        { speaker: 'yasmin', emotion: 'shock', text: 'זה… זה לא נורמלי, סאם.' },
        { speaker: 'sam', text: 'אני חושבת שמישהו, או משהו, מאפס אותי כל לילה בחצות.' },
      ],
      next: 'choice_2',
    },

    choice_2: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { speaker: 'sam', text: 'אני לא יודעת למה אני מספרת לך את זה. אולי כי הפעם זה מרגיש שונה.' },
      ],
      choices: [
        { text: '"אני מבטיחה לחזור מחר ולהזכיר לך הכל."', effects: { affection: 3, glitch: -1 }, next: 'promise_path' },
        { text: '"איך זה בדיוק עובד? מה קורה בדיוק בחצות?"', effects: { glitch: 3, affection: 1 }, next: 'curious_path' },
        { text: '"זה... באמת לא הבעיה שלי."', effects: { rage: 2, affection: -2 }, next: 'cold_path' },
      ],
    },

    promise_path: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { speaker: 'yasmin', emotion: 'smile', text: 'אני מבטיחה לחזור מחר. ולהזכיר לך הכל.' },
        { speaker: 'sam', emotion: 'smile', text: 'תבטיחי? אף אחד לא הבטיח לי משהו כזה. אני… כמעט מאמינה לך.' },
      ],
      next: 'midpoint',
    },

    curious_path: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'glitch' },
      ],
      dialogue: [
        { speaker: 'yasmin', text: 'איך זה בדיוק עובד? מה קורה בדיוק בחצות?' },
        { speaker: 'sam', vfx: 'glitch', text: 'את שואלת יותר מדי שאלות נכונות. זה… זה מזיז משהו מתחת לפני השטח.' },
        { text: 'המנורות מהצהיבות לרגע, כאילו המקום עצמו מקשיב.' },
      ],
      next: 'midpoint',
    },

    cold_path: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'angry' },
      ],
      dialogue: [
        { speaker: 'yasmin', text: 'זה... באמת לא הבעיה שלי.' },
        { speaker: 'sam', emotion: 'angry', text: 'כמובן. למה שזה יהיה הבעיה שלך. שתי את הקפה שלך.' },
        { text: 'היא מסתובבת ומנגבת שולחן שכבר נקי.' },
      ],
      next: 'midpoint',
    },

    midpoint: {
      bg: 'street',
      sprites: [{ id: 'yasmin', pos: 'center', emotion: 'neutral' }],
      dialogue: [
        { text: 'יסמין יוצאת. בחוץ הגשם נעצר באמצע טיפה, לשבריר שנייה, לפני שהוא ממשיך ליפול.' },
        { speaker: 'yasmin', emotion: 'shock', text: 'זה... זה באמת קרה?' },
        { text: 'למחרת בלילה היא חוזרת לאותה דלת בדיוק.' },
      ],
      next: 'wall_cracks',
    },

    wall_cracks: {
      bg: 'cafe_cracked',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'shock' },
        { id: 'customer', pos: 'center', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'shock' },
      ],
      dialogue: [
        { text: 'הפעם אין פעמון. הלקוח בפינה עדיין באותה תזוזה בדיוק, אבל משהו אחר השתנה.' },
        { text: 'התמונה שהייתה תלויה על הקיר איננה. במקומה נפער סדק דק, זוהר בירוק חיוור, כמו קרע קטן במציאות עצמה.' },
        { speaker: 'yasmin', emotion: 'shock', text: 'סאם... מה זה?' },
        { speaker: 'customer', text: '"שוב פעם," הוא לוחש, בלי להרים את המבט מהצלחת שלו.' },
        { speaker: 'sam', emotion: 'shock', vfx: 'glitch', text: 'הוא… הוא מעולם לא דיבר. בשום לילה. מה קורה פה?' },
      ],
      next: 'return_scene',
    },

    return_scene: {
      bg: 'cafe_glitch',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'shock' },
        { id: 'sam', pos: 'right', emotion: 'shock' },
      ],
      dialogue: [
        { text: 'לפני שהיא מספיקה לסיים את המשפט, האור מהבהב. הקירות עצמם מתחילים להתקלף בין טפט פרחוני לרשת קווים ירוקה.' },
        { speaker: 'sam', emotion: 'sad', text: 'משהו משתנה כשאת כאן. אני מפחדת ומקווה בו־זמנית.' },
        { speaker: 'yasmin', emotion: 'shock', text: 'סאם, תחזיקי מעמד. אני כאן.' },
      ],
      next: 'climax_intro',
    },

    climax_intro: {
      bg: 'void',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'shock' },
        { id: 'static', pos: 'center', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'shock' },
      ],
      dialogue: [
        { text: 'החדר מתמוסס לחלוטין לחלל שחור, מנוקד בקווי סטטיקה ירוקים.' },
        { speaker: 'static', vfx: 'glitch', text: 'חריגה מזוהה. יוזם איפוס מלא. תודה שהשתמשת בקפה גליץ\'.' },
        { speaker: 'sam', emotion: 'shock', text: 'זה הוא. זה מה שמאפס אותי כל לילה. בבקשה, אל תיתן לו—' },
        { speaker: 'yasmin', emotion: 'angry', text: 'לא. לא הפעם.' },
      ],
      next: 'choice_3',
    },

    choice_3: {
      bg: 'void',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'static', pos: 'center', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { speaker: 'static', text: 'לישות האנושית: יש לך שבריר שנייה להתערב, או לצפות.' },
      ],
      choices: [
        { text: '"אני לא אתן לך לקחת אותה!"', effects: { affection: 2, rage: 3 }, next: 'end_fight' },
        { text: '"בואי ננסה לתקן את זה בעדינות."', effects: { affection: 2, glitch: -3 }, next: 'end_fix' },
        { text: '"הגליצ\'ים הם חלק ממי שהיא. אני מקבלת אותה ככה."', effects: { affection: 3, rage: -2 }, next: 'end_accept' },
        { text: 'לברוח מהחדר', effects: { glitch: 4, affection: -3 }, next: 'end_flee' },
      ],
    },

    end_fight: { next: 'evaluate_end' },
    end_fix: { next: 'evaluate_end' },
    end_accept: { next: 'evaluate_end' },
    end_flee: { next: 'evaluate_end' },

    evaluate_end: {
      evaluate: true,
      endings: [
        { when: (s) => s.affection >= 6 && s.glitch < 4, next: 'ending_together' },
        { when: (s) => s.rage >= 6 && s.rage >= s.affection && s.rage >= s.glitch, next: 'ending_rage' },
        { when: (s) => s.glitch >= 6 && s.affection < 4, next: 'ending_lost' },
        { when: () => true, next: 'ending_balance' },
      ],
    },

    ending_together: {
      bg: 'cafe',
      ending: true,
      title: 'יחד, יציבים',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { text: 'האור חוזר. הקפה שוב קפה, הקירות שוב קירות.' },
        { speaker: 'sam', emotion: 'smile', text: 'אני… זוכרת. אני זוכרת את אתמול. ואת שלשום. ואותך.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'אז בואי נתחיל מהיום. יחד.' },
        { text: 'השלט בחוץ מפסיק להבהב, לראשונה. "קפה גליץ\'" נדלק שלם, יציב, שקט.' },
      ],
    },

    ending_rage: {
      bg: 'void',
      ending: true,
      title: 'התפרצות',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'angry' },
        { id: 'sam', pos: 'right', emotion: 'angry' },
      ],
      dialogue: [
        { text: 'הזעם של יסמין מתנגש בזעם של סאם, ושני הכוחות קורעים את המקום לגזרים של אור.' },
        { speaker: 'sam', emotion: 'angry', vfx: 'shake', text: 'אולי זה מה שמגיע לכולנו. איפוס. שוב ושוב.' },
        { text: 'יסמין מתעוררת על הרצפה הרטובה, מחוץ לחנות שכבר לא קיימת.' },
      ],
    },

    ending_lost: {
      bg: 'cafe_glitch',
      ending: true,
      title: 'אבודים בלולאה',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'shock' },
        { id: 'sam', pos: 'right', emotion: 'glitch' },
      ],
      dialogue: [
        { text: 'הסקרנות של יסמין פתחה דלת שלא הייתה אמורה להיפתח. המציאות ממשיכה להתקפל פנימה.' },
        { speaker: 'sam', vfx: 'glitch', text: 'אנח//נו נפגש שו//ב. תמי//ד. בלי לזכ//ור.' },
        { text: 'ולמחרת בלילה, יסמין שוב עומדת מול אותה דלת בדיוק, לא זוכרת שכבר הייתה כאן.' },
      ],
    },

    ending_balance: {
      bg: 'cafe_dim',
      ending: true,
      title: 'הגליץ\' ממשיך',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'sad' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { text: 'שום דבר לא נפתר לגמרי, אבל שום דבר גם לא קרס.' },
        { speaker: 'sam', emotion: 'sad', text: 'אולי לא כל תקלה צריכה תיקון. אולי מספיק שמישהו יחזור מדי פעם.' },
        { speaker: 'yasmin', text: 'אז אני אחזור. מחר. ומחרתיים.' },
      ],
    },
  },
};
