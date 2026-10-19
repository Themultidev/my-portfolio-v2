const codes =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const countries = codes
  .map((code) => ({ code, name: names.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name));
export function isCountryCode(value: string): boolean {
  return codes.includes(value);
}
export function countryName(code: string): string {
  return isCountryCode(code) ? (names.of(code) ?? code) : code;
}
export function visitorCountry(
  headers: Pick<Headers, "get">,
  environment: Record<string, string | undefined> = process.env,
): string | null {
  if (environment.VERCEL !== "1") return null;
  const code = headers.get("x-vercel-ip-country")?.toUpperCase();
  return code && isCountryCode(code) ? code : null;
}

export const nigeriaStates = [
  ["AB", "Abia"],
  ["AD", "Adamawa"],
  ["AK", "Akwa Ibom"],
  ["AN", "Anambra"],
  ["BA", "Bauchi"],
  ["BY", "Bayelsa"],
  ["BE", "Benue"],
  ["BO", "Borno"],
  ["CR", "Cross River"],
  ["DE", "Delta"],
  ["EB", "Ebonyi"],
  ["ED", "Edo"],
  ["EK", "Ekiti"],
  ["EN", "Enugu"],
  ["GO", "Gombe"],
  ["IM", "Imo"],
  ["JI", "Jigawa"],
  ["KD", "Kaduna"],
  ["KN", "Kano"],
  ["KT", "Katsina"],
  ["KE", "Kebbi"],
  ["KO", "Kogi"],
  ["KW", "Kwara"],
  ["LA", "Lagos"],
  ["NA", "Nasarawa"],
  ["NI", "Niger"],
  ["OG", "Ogun"],
  ["ON", "Ondo"],
  ["OS", "Osun"],
  ["OY", "Oyo"],
  ["PL", "Plateau"],
  ["RI", "Rivers"],
  ["SO", "Sokoto"],
  ["TA", "Taraba"],
  ["YO", "Yobe"],
  ["ZA", "Zamfara"],
  ["FC", "Federal Capital Territory"],
].map(([code, name]) => ({ code, name }));
export function nigeriaRegion(value: string | null): string | null {
  const code = value?.toUpperCase().replace(/^NG-/, "");
  return code && nigeriaStates.some((state) => state.code === code)
    ? code
    : null;
}
export function regionName(code: string): string | undefined {
  return nigeriaStates.find((state) => state.code === code)?.name;
}
export function validProjectLocation(
  country: string | null,
  region: string | null,
) {
  return (
    (country === null || isCountryCode(country)) &&
    (region === null || (country === "NG" && nigeriaRegion(region) === region))
  );
}
