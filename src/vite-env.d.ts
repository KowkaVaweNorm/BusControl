/**
 * Объявление типов для CSS модулей
 */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Объявление типов для обычных CSS/SCSS файлов
 */
declare module '*.css' {
  const content: { readonly [key: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { readonly [key: string]: string };
  export default content;
}
