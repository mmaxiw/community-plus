/**
 * קוד Apps Script לטופס "הוספת עסק" של קהילה+.
 * מופעל אוטומטית כשמישהו מגיש את הטופס,
 * יוצר branch חדש, מוסיף קובץ .md תחת _businesses/,
 * ופותח Pull Request לאישור ידני.
 *
 * הוראות התקנה מלאות: ראה automation/README.md בריפו.
 */

const GITHUB_OWNER = 'mmaxiw';
const GITHUB_REPO = 'community-plus';
const BASE_BRANCH = 'main';

// שמות השדות בטופס (חייבים להיות זהים בדיוק לשמות בטופס Google Forms).
const FIELD = {
  name:        'שם העסק',
  category:    'קטגוריה',
  description: 'תיאור קצר',
  tags:        'תגיות',
  image:       'קישור לתמונה',
  longText:    'תיאור מלא',
  phone:       'טלפון',
  email:       'אימייל',
  website:     'אתר אינטרנט',
  address:     'כתובת',
};

function onFormSubmit(e) {
  const r = e.namedValues;
  const get = key => ((r[key] || [''])[0] || '').toString().trim();

  const name = get(FIELD.name);
  if (!name) {
    Logger.log('הגשה ללא שם — מתעלם.');
    return;
  }

  const category    = get(FIELD.category);
  const description = get(FIELD.description);
  const tagsRaw     = get(FIELD.tags);
  const image       = get(FIELD.image);
  const longText    = get(FIELD.longText);
  const phone       = get(FIELD.phone);
  const email       = get(FIELD.email);
  const website     = get(FIELD.website);
  const address     = get(FIELD.address);

  const tags = tagsRaw
    .split(/[,،]/)
    .map(t => t.trim())
    .filter(Boolean);

  const lines = ['---'];
  lines.push('name: ' + yamlValue(name));
  if (category)         lines.push('category: ' + yamlValue(category));
  if (image)            lines.push('image: ' + image);
  if (tags.length)      lines.push('tags: [' + tags.map(yamlValue).join(', ') + ']');
  if (description)      lines.push('description: ' + yamlValue(description));

  const contactLines = [];
  if (phone)   contactLines.push('  phone: "' + phone + '"');
  if (email)   contactLines.push('  email: ' + email);
  if (website) contactLines.push('  website: ' + website);
  if (address) contactLines.push('  address: ' + yamlValue(address));
  if (contactLines.length) {
    lines.push('contact:');
    lines.push.apply(lines, contactLines);
  }

  lines.push('---');
  lines.push('');
  lines.push(longText || description || '');
  lines.push('');

  const content = lines.join('\n');
  const slug    = makeSlug(name);
  const path    = '_businesses/' + slug + '.md';
  const branch  = 'submission-' + slug;

  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    throw new Error('GITHUB_TOKEN לא מוגדר ב-Script Properties.');
  }

  const baseSha = ghApi('GET',
    'repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/git/refs/heads/' + BASE_BRANCH,
    token).object.sha;

  ghApi('POST',
    'repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/git/refs',
    token,
    { ref: 'refs/heads/' + branch, sha: baseSha });

  ghApi('PUT',
    'repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + path,
    token,
    {
      message: 'הוספת עסק: ' + name,
      content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
      branch: branch,
    });

  const pr = ghApi('POST',
    'repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/pulls',
    token,
    {
      title: 'הוספת עסק: ' + name,
      head: branch,
      base: BASE_BRANCH,
      body: prBody(name, category, description, tags, image, phone, email, website, address),
    });

  Logger.log('PR נפתח: ' + (pr.html_url || JSON.stringify(pr)));
}

function prBody(name, category, description, tags, image, phone, email, website, address) {
  const rows = [
    '**הגשה חדשה דרך הטופס.**',
    '',
    '| שדה | ערך |',
    '|---|---|',
    '| שם | ' + name + ' |',
  ];
  if (category)    rows.push('| קטגוריה | ' + category + ' |');
  if (description) rows.push('| תיאור קצר | ' + description + ' |');
  if (tags.length) rows.push('| תגיות | ' + tags.join(', ') + ' |');
  if (image)       rows.push('| תמונה | ' + image + ' |');
  if (phone)       rows.push('| טלפון | ' + phone + ' |');
  if (email)       rows.push('| אימייל | ' + email + ' |');
  if (website)     rows.push('| אתר | ' + website + ' |');
  if (address)     rows.push('| כתובת | ' + address + ' |');
  rows.push('');
  rows.push('בדוק את התוכן ואת התמונה לפני המיזוג.');
  return rows.join('\n');
}

function yamlValue(v) {
  if (v === null || v === undefined) return '""';
  const s = String(v);
  if (/[:#&*!|>'"%@`,\[\]\{\}\n]/.test(s) || /^\s|\s$/.test(s)) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return s;
}

function makeSlug(text) {
  let s = String(text).toLowerCase()
    .replace(/[^֐-׿a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (s.length > 50) s = s.substring(0, 50).replace(/-$/, '');
  if (!s) s = 'business';
  return s + '-' + Date.now().toString(36);
}

function ghApi(method, path, token, body) {
  const opts = {
    method: method.toLowerCase(),
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    muteHttpExceptions: true,
    contentType: 'application/json',
  };
  if (body) opts.payload = JSON.stringify(body);

  const res  = UrlFetchApp.fetch('https://api.github.com/' + path, opts);
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code >= 200 && code < 300) {
    return text ? JSON.parse(text) : {};
  }
  throw new Error('GitHub API ' + method + ' ' + path + ' נכשל (' + code + '): ' + text);
}

/**
 * הרצה ידנית לבדיקה — מדמה הגשת טופס.
 * לחץ Run אחרי שהגדרת את GITHUB_TOKEN ב-Script Properties.
 */
function testRun() {
  onFormSubmit({
    namedValues: {
      'שם העסק':       ['בדיקת טופס'],
      'קטגוריה':       ['בדיקה'],
      'תיאור קצר':     ['זוהי הגשת בדיקה אוטומטית'],
      'תגיות':         ['בדיקה, אוטומציה'],
      'קישור לתמונה': ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'],
      'תיאור מלא':     ['תוכן ארוך לבדיקה. אם רואים את ה-PR, הכל עובד.'],
      'טלפון':         ['050-0000000'],
      'אימייל':        ['test@example.com'],
      'אתר אינטרנט':   ['https://example.com'],
      'כתובת':         ['רחוב הבדיקה 1'],
    },
  });
}
