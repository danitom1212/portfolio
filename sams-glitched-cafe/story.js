export const CHARACTERS = {
  yasmin: { name: 'יסמין', color: '#7ec8ff' },
  sam: { name: 'סאם', color: '#ff3fb0' },
  noa: { name: 'נועה', color: '#a58bff' },
};

export const STORY = {
  start: 'intro',
  scenes: {
    intro: {
      bg: 'street',
      sprites: [{ id: 'yasmin', pos: 'center', emotion: 'neutral' }],
      dialogue: [
        { text: 'גשם. שוב. יסמין רצה לאורך הרחוב הרטוב ומחפשת כל דבר עם גג ודלת.' },
        { text: 'שלט ניאון מהבהב תופס את תשומת ליבה: "קפה ה_יץ\' של סאם" — כשהאות ג\' נדלקת רק בערך חצי מהזמן.' },
        { speaker: 'yasmin', text: 'קפה עם שלט שבור. בדיוק ברמה שלי הערב.' },
      ],
      next: 'enter_cafe',
    },

    enter_cafe: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { text: 'הפעמון מצלצל. הבחור מאחורי הדלפק מרים מבט — שיער סגול פרוע, חולצה עם כתמי קפה ישנים, וחיוך שנראה מזיק מדי בשביל שעה כזאת בלילה.' },
        { speaker: 'sam', emotion: 'smile', text: 'ברוכה הבאה לקפה הכי טוב ברדיוס של, נגיד, הרחוב הזה. יש לנו קפה, יש לנו עוגות, ויש לי דעות חזקות על שניהם.' },
        { speaker: 'yasmin', text: 'ויש לך שלט שחצי מהאותיות שלו לא עובדות.' },
        { speaker: 'sam', text: 'זה לא באג, זו אישיות. "קפה ה_יץ\' של סאם" נשמע כמו מקום שיודע סודות.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'ואתה יודע סודות?' },
        { speaker: 'sam', emotion: 'smile', text: 'אחד או שניים. תתיישבי, תתייבשי, ותני לי הזדמנות לא לקלקל את הרושם הראשוני.' },
      ],
      next: 'choice_1',
    },

    choice_1: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { speaker: 'sam', text: 'אז. מה בא לך? יש לי תיאוריה שאפשר לדעת המון על מישהי מהזמנה שלה.' },
      ],
      choices: [
        { text: '"תפתיע אותי. אני סומכת עליך."', effects: { affection: 2 }, next: 'order_kind' },
        { text: '"קפה שחור, בלי סיפורים."', effects: { affection: 0 }, next: 'order_neutral' },
        { text: '"בוא נראה אם אתה שווה את המוניטין שלך."', effects: { affection: -1, rage: 1 }, next: 'order_mock' },
      ],
    },

    order_kind: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { speaker: 'sam', text: 'סומכת עליי. מסוכן. בסדר — אני הולך על לאטה עם קינמון, כי משהו אומר לי שאת לא סוג של "וניל רגיל".' },
        { text: 'הוא מגיש את הכוס וידיו נשארות שם רגע ארוך מדי מכדי להיות מקרי.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'ומה גורם לך לחשוב שאני לא וניל רגיל?' },
        { speaker: 'sam', emotion: 'smile', text: 'את נכנסת לקפה זר בגשם, בשעה הזאת, ומחייכת למרות זה. זה כבר מספר סיפור.' },
        { speaker: 'yasmin', text: 'או שפשוט קפוא לי בחוץ.' },
        { speaker: 'sam', text: 'גם זה סיפור. פחות מעניין, אבל בסדר.' },
      ],
      next: 'spark',
    },

    order_neutral: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { speaker: 'yasmin', text: 'קפה שחור. בלי תוספות, בלי דרמה.' },
        { speaker: 'sam', emotion: 'neutral', text: 'כבוד. אנשים שמזמינים קפה שחור בדרך כלל יודעים בדיוק מה הם רוצים. זה נדיר.' },
        { speaker: 'sam', emotion: 'smile', text: 'אני, לשם ההשוואה, מזמין לעצמי משהו חדש בכל פעם ומתחרט עליו בכל פעם.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'זה נשמע כמו פילוסופיית חיים.' },
        { speaker: 'sam', text: 'זו בהחלט הסיבה שהמקום הזה עדיין לא סגור.' },
      ],
      next: 'spark',
    },

    order_mock: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'angry' },
      ],
      dialogue: [
        { speaker: 'yasmin', emotion: 'smile', text: 'תראה לי מה יש לך. אני קצת סקפטית לגבי המוניטין.' },
        { speaker: 'sam', emotion: 'angry', vfx: 'shake', text: 'סקפטית. יפה. בסדר, גברתי המבקרת — יוצא לך קפה שיגרום לך לכתוב לי ביקורת של חמישה כוכבים בעל כורחך.' },
        { text: 'הוא מקציף, שופך, וזורק את הכוס על הדלפק בתנועה תיאטרלית מוגזמת שגורמת לה לצחוק בעל כורחה.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'אוקיי, זה היה... מרשים יותר משציפיתי.' },
        { speaker: 'sam', emotion: 'smile', text: 'אני מקבל "מרשים יותר משציפיתי". אני חורט את זה על השלט בחוץ.' },
      ],
      next: 'spark',
    },

    spark: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { speaker: 'sam', text: 'את יודעת, את מוזרה. את הלקוחה הראשונה בשבועות שלא הבהילה אותי מהדלפק תוך שתי דקות.' },
        { speaker: 'yasmin', text: 'זו מחמאה מפוקפקת.' },
        { speaker: 'sam', emotion: 'sad', text: 'אני פשוט... לא כל כך טוב עם אנשים חדשים לאחרונה. יש לי היסטוריה של לתת למישהי להתקרב ואז לפשל בגדול.' },
        { text: 'לרגע הוא נראה מבוגר יותר מגילו, כמו מישהו שסוחב משהו כבד בשקט.' },
        { speaker: 'yasmin', emotion: 'neutral', text: 'כולנו סוחבים משהו. השאלה היא רק כמה מזה מוכנים לשתף.' },
      ],
      next: 'choice_2',
    },

    choice_2: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { speaker: 'sam', text: 'זה תלוי במי שואלת, ובכמה אני סומך עליה.' },
      ],
      choices: [
        { text: '"אני מבטיחה לחזור מחר. תן לי סיבה לסמוך עליך."', effects: { affection: 3 }, next: 'promise_path' },
        { text: '"אז ספר לי. מה בדיוק פישלת בגדול?"', effects: { affection: 1, doubt: 1 }, next: 'curious_path' },
        { text: '"זה באמת לא העניין שלי."', effects: { rage: 2, affection: -2 }, next: 'cold_path' },
      ],
    },

    promise_path: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { speaker: 'yasmin', emotion: 'smile', text: 'אני מבטיחה לחזור מחר. תן לי רק סיבה טובה לסמוך עליך.' },
        { speaker: 'sam', emotion: 'smile', text: 'אף אחת לא הבטיחה לי משהו כל כך פשוט וכל כך גדול בבת אחת.' },
        { text: 'הוא נשען קרוב יותר על הדלפק, קרוב מספיק שהיא קולטת ריח של קפה וקינמון.' },
        { speaker: 'sam', text: 'בסדר. הנה הסיבה: אני עדיין כאן, כל לילה, מחכה שמישהי תיכנס ותהיה שווה את זה. אולי זו את.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'זה... לחץ לא קטן בשביל כוס קפה ראשונה.' },
      ],
      next: 'montage',
    },

    curious_path: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { speaker: 'yasmin', text: 'אז ספר לי. מה בדיוק פישלת בגדול?' },
        { speaker: 'sam', emotion: 'sad', text: 'זה... לא סיפור לכוס קפה ראשונה. בוא נגיד שהיו לי תוכניות גדולות עם מישהי, והתוכניות התפרקו יותר מהר משציפיתי.' },
        { speaker: 'yasmin', emotion: 'neutral', text: 'זה מספיק מעורפל כדי לעורר בי עוד יותר סקרנות.' },
        { speaker: 'sam', emotion: 'smile', text: 'זו הכוונה. תחזרי, ואולי אספר לך עוד קצת בכל פעם.' },
      ],
      next: 'montage',
    },

    cold_path: {
      bg: 'cafe',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'angry' },
      ],
      dialogue: [
        { speaker: 'yasmin', text: 'זה באמת לא העניין שלי. אנחנו בקושי מכירים.' },
        { speaker: 'sam', emotion: 'angry', text: 'נכון. שכחתי לרגע עם מי אני מדבר.' },
        { text: 'הוא מסתובב ומתחיל לנגב משטח שכבר נקי, והשקט בין שניהם נהיה כבד יותר משצריך.' },
        { speaker: 'sam', text: 'סליחה. זה לא באמת עלייך. תשתי את הקפה שלך.' },
      ],
      next: 'montage',
    },

    montage: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { text: 'השבועות הבאים מתמצים לכמה תמונות: יסמין שיודעת בדיוק על איזה כיסא לשבת. סאם ששומר לה את העוגה האחרונה בלי שתבקש.' },
        { speaker: 'sam', emotion: 'smile', text: 'קבעת. הכיסא הזה נקרא עכשיו "הכיסא של יסמין". יש לי שלט קטן שאני מתכנן להדפיס.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'תדפיס אותו ואני עוברת לגור כאן רשמית.' },
        { text: 'לילה אחרי לילה, השיחות מתארכות אחרי שהמקום אמור להיסגר. אף אחד מהם לא ממהר לכבות את האורות.' },
        { speaker: 'sam', text: 'את יודעת שאת הלקוחה היחידה שאני נותן לה לשבת אחרי הסגירה?' },
        { speaker: 'yasmin', text: 'זה בגלל שאני עוזרת לך לסגור קופה, או כי אתה נהנה מהחברה?' },
        { speaker: 'sam', emotion: 'smile', text: 'שני הדברים יכולים להיות נכונים בבת אחת.' },
      ],
      next: 'noa_intro',
    },

    noa_intro: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'neutral' },
      ],
      dialogue: [
        { text: 'יש אישה שיושבת תמיד באותה פינה, מזמינה תה, כמעט ולא מדברת. יסמין שמה לב אליה כבר שבוע שלישי ברציפות.' },
        { speaker: 'yasmin', text: 'מי האישה בפינה? היא כאן כל לילה כמוני.' },
        { text: 'לרגע קצר מדי משהו חולף על פניו של סאם — לא בהלה, משהו יותר עתיק, כמו עייפות ישנה.' },
        { speaker: 'sam', emotion: 'neutral', text: 'נועה. היא... לקוחה ותיקה. מהימים הראשונים של המקום.' },
        { speaker: 'yasmin', emotion: 'neutral', text: 'אתה נשמע כאילו זה מסובך יותר מ"לקוחה ותיקה".' },
        { speaker: 'sam', text: 'הכל כאן קצת מסובך יותר משזה נשמע. בואי לא נתחיל בזה הערב.' },
      ],
      next: 'return_scene',
    },

    return_scene: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { text: 'הלילה המקום כמעט ריק. סאם מכבה את השלט החיצוני ומשאיר רק את האורות הפנימיים החמים.' },
        { speaker: 'sam', emotion: 'smile', text: 'את יודעת, בשבוע הראשון הייתי בטוח שאת סתם עוברת אורח. עכשיו אני כבר לא זוכר איך המקום נראה בלעדייך.' },
        { text: 'הוא מתקרב, קרוב יותר משהתכוון כנראה, והרגע נמתח בין הצחוק לבין משהו אחר לגמרי.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'סאם... יש עוד משהו שאתה לא מספר לי. אני מרגישה את זה כל פעם שנועה נכנסת.' },
        { speaker: 'sam', emotion: 'sad', text: 'יסמין, אני... אני רוצה לספר לך. פשוט תני לי עוד קצת זמן. בבקשה.' },
        { text: 'הפעמון מצלצל. נועה נכנסת, מוקדם משהרגילה, ועיניה נעצרות בשניהם עומדים כל כך קרוב.' },
      ],
      next: 'confrontation_build',
    },

    confrontation_build: {
      bg: 'cafe_dim',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'shock' },
        { id: 'noa', pos: 'center', emotion: 'neutral' },
      ],
      dialogue: [
        { speaker: 'noa', emotion: 'neutral', text: 'מצטערת. לא התכוונתי להפריע ל... מה שזה לא יהיה שקורה כאן.' },
        { speaker: 'sam', emotion: 'shock', text: 'נועה, זה לא הזמן.' },
        { speaker: 'noa', vfx: 'shake', text: 'תמיד "לא הזמן" איתך, סאם. מתי בדיוק כן יהיה הזמן?' },
        { speaker: 'yasmin', emotion: 'neutral', text: 'מישהו רוצה להסביר לי מה קורה כאן, בין שני המשפטים החצי-גמורים האלה?' },
        { speaker: 'noa', emotion: 'sad', text: 'הוא לא סיפר לך. כמובן שהוא לא סיפר לך.' },
        { text: 'שקט כבד נופל על המקום, כבד יותר מכל שקט שהיה ביניהם עד עכשיו.' },
      ],
      next: 'twist_reveal',
    },

    twist_reveal: {
      bg: 'cafe_cracked',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'shock' },
        { id: 'noa', pos: 'center', emotion: 'sad' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { speaker: 'noa', text: 'אני נועה. הבעלים השותפה של המקום הזה. ואשתו של סאם — טכנית. על הנייר. עדיין.' },
        { speaker: 'yasmin', emotion: 'shock', text: 'אשתו?' },
        { speaker: 'sam', emotion: 'sad', text: 'אנחנו פרודים כבר שנה. הגירושים תקועים בגלל המקום הזה — אף אחד מאיתנו לא היה מוכן לוותר עליו.' },
        { speaker: 'noa', text: 'הוא אמר לך שהוא חופשי?' },
        { speaker: 'yasmin', text: 'הוא לא אמר כלום. וזו בדיוק הבעיה.' },
        { speaker: 'sam', emotion: 'sad', text: 'פחדתי שאם אספר לך את זה בלילה הראשון, לא תיתני לי אפילו הזדמנות אחת.' },
        { speaker: 'sam', text: 'לא רימיתי אותך עם מישהי. אבל שיקרתי לך בשתיקה, כל לילה, ולזה אין באמת הבדל.' },
        { speaker: 'noa', emotion: 'sad', text: 'ולמען הסדר — אני לא כאן כדי להחזיר אותו. אני כאן כי יש לי חצי מהמקום הזה, ולא הרבה מקומות אחרים ללכת אליהם בלילה.' },
        { text: 'יסמין מביטה בשניהם, בקפה שהפך פתאום זר, בקירות שהיא ידעה בעל פה ושעכשיו נראים לה כמו של מישהי אחרת.' },
      ],
      next: 'choice_3',
    },

    choice_3: {
      bg: 'cafe_cracked',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'shock' },
        { id: 'noa', pos: 'center', emotion: 'sad' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { text: 'הכל מחכה לתשובה שלה. הגשם בחוץ לא מפסיק.' },
      ],
      choices: [
        { text: '"את נשואה לו?! איך יכולת לשקר לי ככה?"', effects: { rage: 5, affection: -1 }, next: 'end_confront' },
        { text: '[לצאת בלי מילה נוספת]', effects: { doubt: 5, affection: -2 }, next: 'end_leave' },
        { text: '"תסביר לי הכל. אני רוצה להבין, לא לברוח."', effects: { affection: 5, doubt: -1 }, next: 'end_stay' },
        { text: '"אתם יודעים מה? תסתדרו אתם השניים. אני הולכת להזמין לעצמי עוד עוגה."', effects: { chaos: 10, affection: 1 }, next: 'end_chaos' },
      ],
    },

    end_confront: { next: 'evaluate_end' },
    end_leave: { next: 'evaluate_end' },
    end_stay: { next: 'evaluate_end' },
    end_chaos: { next: 'evaluate_end' },

    evaluate_end: {
      evaluate: true,
      endings: [
        { when: (s) => s.chaos >= 5, next: 'ending_chaos' },
        { when: (s) => s.affection >= s.rage && s.affection >= s.doubt, next: 'ending_together' },
        { when: (s) => s.rage > s.affection && s.rage >= s.doubt, next: 'ending_heartbreak' },
        { when: () => true, next: 'ending_friends' },
      ],
    },

    ending_together: {
      bg: 'cafe_dim',
      ending: true,
      title: 'לבחור אחד בשני',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'sam', pos: 'right', emotion: 'smile' },
      ],
      dialogue: [
        { text: 'הגשם נחלש למשהו רך יותר. סאם חותם על ניירת שדחה במשך שנה, בעט שרועד קצת ביד שלו.' },
        { speaker: 'sam', emotion: 'smile', text: 'זה רשמי. חצי מהמקום שייך לנועה, בלי שום קשר לחיים שלנו. וכל שאר החיים שלי... פנוי.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'לא נעים לי מהאישה שהתעקשה להישאר שנה שלמה כי לא היה לה לאן ללכת.' },
        { speaker: 'sam', text: 'אז בוא נציע לה במקום זאת שותפות עסקית אמיתית. ואני מציע לך — את הכיסא הזה, כל ערב, לתמיד.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'זו הצעת נישואים הכי גרועה שיש. אני מקבלת.' },
        { text: 'השלט בחוץ נדלק, לראשונה, שלם — כל האותיות דולקות: "קפה הגליץ\' של סאם". אולי הם ישאירו אותו ככה, כתזכורת.' },
      ],
    },

    ending_heartbreak: {
      bg: 'street',
      ending: true,
      title: 'הגשם שלא נעצר',
      sprites: [{ id: 'yasmin', pos: 'center', emotion: 'sad' }],
      dialogue: [
        { text: 'היא לא חוזרת. לא באותו לילה, ולא בלילה שאחריו.' },
        { speaker: 'yasmin', emotion: 'sad', text: 'הוא היה צריך רק לספר לי. לא הייתי בורחת מהאמת. ברחתי מהשקר.' },
        { text: 'חודשים אחר כך היא עדיין עוברת ליד השלט המהבהב, לפעמים חוצה לצד השני של הרחוב רק כדי לא להביט פנימה.' },
        { text: 'יש עדיין לילות שהיא מתגעגעת לריח של קינמון וקפה. היא פשוט לא מתגעגעת מספיק כדי לפתוח את הדלת.' },
      ],
    },

    ending_friends: {
      bg: 'cafe',
      ending: true,
      title: 'מה שנשאר',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'neutral' },
        { id: 'sam', pos: 'right', emotion: 'sad' },
      ],
      dialogue: [
        { text: 'היא חוזרת, בסוף, אבל לא לאותו כיסא. ולא לאותה שיחה.' },
        { speaker: 'yasmin', text: 'אני לא יכולה להיות איתך ככה, סאם. לא כל עוד יש לך רגל אחת בחיים ישנים שלא סגרת.' },
        { speaker: 'sam', emotion: 'sad', text: 'אני יודע. הייתי צריך לבחור מזמן, ובחרתי מאוחר מדי.' },
        { speaker: 'yasmin', emotion: 'neutral', text: 'אני עדיין רוצה את הקפה שלך. ואת השיחות. רק בלי כל השאר.' },
        { speaker: 'sam', text: 'אני אקח את זה. זה יותר משמגיע לי.' },
        { text: 'זה לא הסוף שיסמין דמיינה, אבל היא לומדת לחיות עם הצורה שבה סיפורים אמיתיים בדרך כלל מסתיימים.' },
      ],
    },

    ending_chaos: {
      bg: 'cafe',
      ending: true,
      title: 'ברית לא צפויה',
      sprites: [
        { id: 'yasmin', pos: 'left', emotion: 'smile' },
        { id: 'noa', pos: 'center', emotion: 'smile' },
      ],
      dialogue: [
        { text: 'שלושה חודשים אחר כך, יסמין ונועה יושבות באותו שולחן, חולקות עוגה, ומחליפות מבטים בכל פעם שסאם מנסה למכור להן רעיון עסקי חדש.' },
        { speaker: 'noa', emotion: 'smile', text: 'האמת? ציפיתי לשנוא אותך. במקום זה גילית לי שיש בעולם עוד מישהי שסובלת מהדרמה שלו יותר טוב ממני.' },
        { speaker: 'yasmin', emotion: 'smile', text: 'זה תפקיד במשרה חלקית. הוא כבר סיפר לך שהוא ניסה למכור לי "לאטה חד-קרן"?' },
        { speaker: 'noa', text: 'לא נדע לו רחמים.' },
        { text: 'מאחורי הדלפק, סאם מביט בשתיהן צוחקות עליו יחד ומבין שהפסיד בגדול — ושאולי, דווקא ככה, זה בסדר.' },
      ],
    },
  },
};
