# Taimas Yedrissov — Admissions Consulting Portfolio

Одностраничный сайт-портфолио результатов сезона 2025/26. Plain HTML/CSS/JS, без билд-шага — деплоится на GitHub Pages как есть.

## Структура

```
index.html
assets/
  css/style.css
  js/main.js          # fade-in анимации (IntersectionObserver)
  fonts/dov-regular.woff2 + .ttf   # DOV — основной display-шрифт
  img/portrait.jpg    # ← положи сюда свою фотографию (4:5 или квадрат)
  img/portrait-placeholder.svg
```

## Как заменить фото

Добавь файл `assets/img/portrait.jpg` — сайт подхватит его автоматически (сейчас показывается плейсхолдер).

## Как заменить контакт

В `index.html` найди `mailto:hello@example.com` и поставь свой email.

## Деплой

GitHub Pages, ветка `main`, корень репозитория. Файл `.nojekyll` отключает обработку Jekyll.
