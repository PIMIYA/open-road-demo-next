import crypto from 'crypto';
import gen from 'random-seed';

const rand = gen.create();

export function random(min, max = null) {
  if (max === null) {
    max = min;
    min = 0;
  }
  return rand.floatBetween(min, max);
}

export function getRandomDate() {
  const start = new Date(2021, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + random(end.getTime() - start.getTime()));
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export function getRandomPeriod() {
  const start = new Date(2021, 0, 1);
  const end = new Date();
  const date1 = new Date(start.getTime() + random(end.getTime() - start.getTime()));
  const date2 = new Date(date1.getTime() + random(end.getTime() - date1.getTime()));
  return `${date1.getFullYear()}/${date1.getMonth() + 1}/${date1.getDate()} - ${date2.getFullYear()}/${date2.getMonth() + 1}/${date2.getDate()}`;
}

export function getRandomPlace() {
  const places = ["台中國家歌劇院", "The wall", "地下社會", "國家戲劇院", "revolver"];
  return places[~~(random(places.length))];
}

export function getRandomCreator() {
  const creators = ["舞蹈空間✕海德堡舞蹈劇場", "莎士比亞的妹妹們的劇團✕庭劇團PENINO", "無垢舞蹈劇場", "新點子實驗場 李祐緯"];
  return creators[~~(random(creators.length))];
}

export function getRandomObjectType() {
  const objectTypes = ["節目單", "節目主視覺", "劇場設計圖", "練習側拍"];
  return objectTypes[~~(random(objectTypes.length))];
}

export function getRandomText() {
  return 'Lorem ipsum dolor sit amet consectetur. Morbi ut nisl egestas viverra risus ac lorem nisl laoreet. Sem senectus tortor ac nisi augue vulputate massa enim. Sed eu odio ullamcorper sed lacus nibh. Rhoncus sit morbi nisl tortor eget etiam.';
}

export function getRandomTags() {
  const tags = ["舞蹈", "音樂", "戲劇", "展覽", "講座"];

  for (let i = tags.length - 1; i > 0; i--) {
    const j = ~~(random((i + 1)));
    [tags[i], tags[j]] = [tags[j], tags[i]];
  }

  return tags.slice(0, ~~(random(tags.length)));
}

// !WARNING: This is a dummy encryption/decryption function
// Simplified key and IV (should be obtained from a secure source in actual applications)
const key = '1234567890123456'; // 16-byte key
const iv = '1234567890123456'; // 16-byte IV

export function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-128-ctr', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  encrypted = encrypted.replace(/\//g, '___');
  return encrypted;
}

export function decrypt(encrypted) {
  encrypted = encrypted.replace(/___/g, '/');
  const decipher = crypto.createDecipheriv('aes-128-ctr', key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


export function getWalletCanvasData(count = 10) {
  count = count == null ? ~~random(5, 14) : count;

  const dummyData = {
    claimedTokens: [],
    count,
  };

  const tagOptions = [
    { main: "Visual", sub: "Painting" },
    { main: "Visual", sub: "Installation" },
    { main: "Visual", sub: "Sculpture" },
    { main: "Visual", sub: "Photography" },
    { main: "Performance", sub: "Circus" },
    { main: "Performance", sub: "Musical" },
    { main: "Design", sub: "Interactive" },
    { main: "Design", sub: "Graphic" },
  ];

  for (let i = 0; i < count; i++) {
    const totalAmount = ~~random(50, 150);
    const claimedAmount = ~~random(1, totalAmount);

    let tagIds = [];
    let tagCount = ~~random(1, 9); // 1 ~ 8

    while (tagCount--) {
      tagIds.push(~~random(tagOptions.length));
    }

    tagIds = tagIds.filter((tag, index) => tagIds.indexOf(tag) === index);
    const tags = tagIds.map(tagId => tagOptions[tagId]);

    dummyData.claimedTokens.push({
      title: getRandomCreator(),
      claimedDate: getRandomDate(),
      categoryId: ~~random(1, 6), // 1 ~ 5
      tags,
      totalAmount,
      claimedAmount,
      cliamedPercentage: claimedAmount / totalAmount,
      lat: random(22, 25),
      lan: random(120, 122),
    });
  }

  // sort
  dummyData.claimedTokens.sort((a, b) => {
    return new Date(a.claimedDate) - new Date(b.claimedDate);
  });

  return dummyData;

}
