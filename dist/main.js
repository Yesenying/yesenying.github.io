const hello = document.getElementById('hello');
hello.addEventListener('click', () => {
  document.getElementById('reply').textContent = '你好呀。希望今天也有一点让你开心的小事。';
});
