async function test() {
  const url = "https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/156/partner/586/product/020110/year/2022/datatype/reported?format=JSON";
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(text.substring(0, 1000));
  } catch(e) {
    console.error(e);
  }
}
test();
