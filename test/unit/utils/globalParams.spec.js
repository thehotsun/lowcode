import globalParams from '@/CommonDP/utils/globalParams';

describe('globalParams', () => {
  it('init', () => {
    globalParams.set('str', 'abc');
    globalParams.set('fn', () => {
      console.log('param function called');
      return 'yes';
    });
  });

  test('get', () => {
    expect(globalParams.get('str')).toEqual('abc');
    expect(globalParams.get('fn')).toEqual('yes');
  });
});
