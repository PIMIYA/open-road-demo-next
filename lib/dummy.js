export function getRandomDate() {
  const start = new Date(2021, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export function getRandomPlace() {
  const places = ["台中國家歌劇院", "The wall", "地下社會", "國家戲劇院", "revolver"];
  return places[~~(Math.random() * places.length)];
}

export function getRandomCreator() {
  const creators = ["舞蹈空間✕海德堡舞蹈劇場", "莎士比亞的妹妹們的劇團✕庭劇團PENINO", "無垢舞蹈劇場", "新點子實驗場 李祐緯"];
  return creators[~~(Math.random() * creators.length)];
}

export function getRandomText() {
  return 'Lorem ipsum dolor sit amet consectetur. Morbi ut nisl egestas viverra risus ac lorem nisl laoreet. Sem senectus tortor ac nisi augue vulputate massa enim. Sed eu odio ullamcorper sed lacus nibh. Rhoncus sit morbi nisl tortor eget etiam.';
}
