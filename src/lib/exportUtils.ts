export const getStandardUserFilename = (
  context: 'supplier' | 'buyer' | 'tariff', 
  pageNo: number,
  extension: 'pdf' | 'xlsx'
) => {
  const baseName = context === 'supplier' 
    ? 'supplier_data' 
    : context === 'buyer' 
    ? 'buyer_data' 
    : 'trade_tariff_data';

  return `${baseName}_page_${pageNo}.${extension}`;
};
