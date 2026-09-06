import { brand, brandFooter, premiumEmbed } from "./brand.js";

export function baseEmbed(title, description) {
  return premiumEmbed({
    title,
    description,
    color: brand.color,
    footer: brandFooter(),
  });
}

export function successEmbed(description, title = "Başarılı") {
  return premiumEmbed({
    title,
    description,
    color: brand.colors.success,
    footer: brandFooter(),
  });
}

export function errorEmbed(description, title = "Hata") {
  return premiumEmbed({
    title,
    description,
    color: brand.colors.danger,
    footer: brandFooter(),
  });
}

export function warnEmbed(description, title = "Uyarı") {
  return premiumEmbed({
    title,
    description,
    color: brand.colors.warn,
    footer: brandFooter(),
  });
}

export function infoEmbed(description, title = "Bilgi") {
  return premiumEmbed({
    title,
    description,
    color: brand.colors.info,
    footer: brandFooter(),
  });
}
