async function main() {
  const pwd = '3595736B-435D-4A5D-BEFB-8E552F32BA71';
  const hash = await Bun.password.hash(pwd);
  console.log(hash);

  const h2 = Bun.hash(
    'eyJhbGciOiJSUzUxMiJ9.eyJ1c2VyX2lkIjoiMTI0ODAxNjMyNjk5MzIyMzY4IiwidHlwZV9pZCI6MiwiaWF0IjoxNzA1MDc2NzQ4LCJleHAiOjE3MDUwODAzNDh9.I0AeE3fiFvjAPMsVd3mgKTgV52FpDpe4_eWFxVtaJdimif-MSAnG2Xkz2CeGj6gIrva_YNEHctdwxsq8TJgkoUE8hucvqWcBxG5gaxsVuovVwHKliSz_gvKwzY1TIhfgBXsydfzvlYGHgjJAraONviWE27QcGH_yN32no2tYPrFI1bDUZcJc7mI73B3yZUXf2iVvwg39BSm4MDHjKuvzzCEsj9KZOsCcX0GgxaO9rRz4-cJfO3mjee6ld7hhviS-4OUemsERJd15kpSmoHfgl3PI-7Usmd8yJyeWmapy-vLwj7DyzVLD064xQBzIs8jGlwefAdUkF-QqYrvL0QYAFA'
  );
  console.log(h2);
}

main();
