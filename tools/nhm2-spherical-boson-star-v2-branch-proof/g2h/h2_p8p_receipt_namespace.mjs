// Closed transport revisions; these do not change receipt content or science.
export function receiptNamespace(kind,revision='original'){
 if(!['fixture','archive'].includes(kind)||!['original','retained-helper-v1','retained-helper-v2'].includes(revision))
  throw Error('receipt_namespace_scope');
 return `nhm2-${kind}${revision==='original'?'':revision==='retained-helper-v1'?'-retained-v1':'-retained-v2'}`;
}
