async function getNews() {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = await res.json();
  const top3 = ids.slice(0, 3);
  const news = [];
  for (const id of top3) {
    const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    const item = await itemRes.json();
    news.push(`- <a href="${item.url}" target="_blank">${item.title}</a>`);
  }
  console.log(news.join('\n'));
}
getNews();
