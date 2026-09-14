const fs=require('node:fs');
for(const [oldName,newName] of [['compare-native-pairing-20260914.cjs','compare-review-recovery-20260914.cjs'],['scan-native-pairing-fixtures-20260914.cjs','scan-review-recovery-fixtures-20260914.cjs']]) {
  let s=fs.readFileSync('.tmp/'+oldName,'utf8').replaceAll('release-native-pairing-20260914','release-review-recovery-20260914').replaceAll('2026-09-14-native-pairing-package.json','2026-09-14-review-recovery-package.json').replaceAll('2026-09-14-native-pairing-fixture-scan.json','2026-09-14-review-recovery-fixture-scan.json');
  if(newName.startsWith('scan-')) s=s.replace("const markers = [", "const markers = ['room:player-review-fixture','subject:player-review-alice','fixture:origin-provider','chat:origin-exact','pairing-origin-browser-',");
  fs.writeFileSync('.tmp/'+newName,s,{flag:'wx'});
}
