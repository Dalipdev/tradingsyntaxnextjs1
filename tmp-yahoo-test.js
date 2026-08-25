const urls = [
  'https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EIBEX,FTSEMIB.MI,%5EAEX,%5EN225,%5EHSI,000001.SS,%5EAXJO,%5EKS11,%5EBSESN',
  'https://query2.finance.yahoo.com/v7/finance/quote?symbols=%5EIBEX,FTSEMIB.MI,%5EAEX,%5EN225,%5EHSI,000001.SS,%5EAXJO,%5EKS11,%5EBSESN'
];

(async () => {
  for (const url of urls) {
    try {
      console.log('URL:', url);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      console.log('  status:', res.status);
      const body = await res.text();
      console.log('  body:', body.slice(0, 800));
    } catch (err) {
      console.error('  error:', err);
    }
  }
})();
