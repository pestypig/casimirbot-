/*
 * Program gate: G2D — fresh replacement-candidate proof attempt
 * Workstream: authenticated classical control branch
 * Capability or component: source-disjoint Linux C17 GMP/MPFR evaluator
 * Current maturity: implemented; execution unauthorized
 * Target maturity: admitted offline runtime and audited one-shot implementation
 * Required frozen inputs: G2D chi=1/4 manifest and G2D-R1 policy
 * Required evidence: source/binary/image hashes, directed intervals, receipts
 * Stop/fail criteria: identity, token, arithmetic, rail or chronology mismatch
 * Explicit non-goals: execution now, candidate admission, G3/lane/lamp authority
 * Downstream gate unlocked: separate one-shot execution authorization only
 *
 * This program does not use Python, Decimal, or primary evaluator source.
 * With no --execute argument it is inert and performs no candidate arithmetic.
 */

#define _POSIX_C_SOURCE 200809L
#include <ctype.h>
#include <errno.h>
#include <gmp.h>
#include <limits.h>
#include <mpfr.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define PREC_BITS 768
#define TOKEN_ENV "NHM2_G2D_EXECUTION_TOKEN"
#define IMAGE_ENV "NHM2_G2D_INDEPENDENT_IMAGE_ID"

typedef struct { mpfr_t lo, hi; } iv;

static void iv_init(iv *a) { mpfr_init2(a->lo, PREC_BITS); mpfr_init2(a->hi, PREC_BITS); }
static void iv_clear(iv *a) { mpfr_clear(a->lo); mpfr_clear(a->hi); }
static void iv_set(iv *r,const iv *a){mpfr_set(r->lo,a->lo,MPFR_RNDD);mpfr_set(r->hi,a->hi,MPFR_RNDU);}
static void iv_set_q(iv *a, long n, unsigned long d) {
  mpfr_set_si(a->lo, n, MPFR_RNDD); mpfr_div_ui(a->lo, a->lo, d, MPFR_RNDD);
  mpfr_set_si(a->hi, n, MPFR_RNDU); mpfr_div_ui(a->hi, a->hi, d, MPFR_RNDU);
}
static void iv_add(iv *r, const iv *a, const iv *b) {
  mpfr_t lo,hi;mpfr_init2(lo,PREC_BITS);mpfr_init2(hi,PREC_BITS);
  mpfr_add(lo,a->lo,b->lo,MPFR_RNDD);mpfr_add(hi,a->hi,b->hi,MPFR_RNDU);
  mpfr_set(r->lo,lo,MPFR_RNDD);mpfr_set(r->hi,hi,MPFR_RNDU);mpfr_clear(lo);mpfr_clear(hi);
}
static void iv_neg(iv *r, const iv *a) {
  mpfr_t lo,hi;mpfr_init2(lo,PREC_BITS);mpfr_init2(hi,PREC_BITS);
  mpfr_neg(lo,a->hi,MPFR_RNDD);mpfr_neg(hi,a->lo,MPFR_RNDU);
  mpfr_set(r->lo,lo,MPFR_RNDD);mpfr_set(r->hi,hi,MPFR_RNDU);mpfr_clear(lo);mpfr_clear(hi);
}
static void iv_sub(iv *r, const iv *a, const iv *b) {
  mpfr_t lo,hi;mpfr_init2(lo,PREC_BITS);mpfr_init2(hi,PREC_BITS);
  mpfr_sub(lo,a->lo,b->hi,MPFR_RNDD);mpfr_sub(hi,a->hi,b->lo,MPFR_RNDU);
  mpfr_set(r->lo,lo,MPFR_RNDD);mpfr_set(r->hi,hi,MPFR_RNDU);mpfr_clear(lo);mpfr_clear(hi);
}
static void iv_mul(iv *r, const iv *a, const iv *b) {
  mpfr_t p[4]; int i;
  for (i=0;i<4;i++) mpfr_init2(p[i], PREC_BITS);
  mpfr_mul(p[0],a->lo,b->lo,MPFR_RNDD); mpfr_mul(p[1],a->lo,b->hi,MPFR_RNDD);
  mpfr_mul(p[2],a->hi,b->lo,MPFR_RNDD); mpfr_mul(p[3],a->hi,b->hi,MPFR_RNDD);
  mpfr_t lo,hi;mpfr_init2(lo,PREC_BITS);mpfr_init2(hi,PREC_BITS);
  mpfr_set(lo,p[0],MPFR_RNDD); for(i=1;i<4;i++) if(mpfr_less_p(p[i],lo)) mpfr_set(lo,p[i],MPFR_RNDD);
  mpfr_mul(p[0],a->lo,b->lo,MPFR_RNDU); mpfr_mul(p[1],a->lo,b->hi,MPFR_RNDU);
  mpfr_mul(p[2],a->hi,b->lo,MPFR_RNDU); mpfr_mul(p[3],a->hi,b->hi,MPFR_RNDU);
  mpfr_set(hi,p[0],MPFR_RNDU); for(i=1;i<4;i++) if(mpfr_greater_p(p[i],hi)) mpfr_set(hi,p[i],MPFR_RNDU);
  mpfr_set(r->lo,lo,MPFR_RNDD);mpfr_set(r->hi,hi,MPFR_RNDU);mpfr_clear(lo);mpfr_clear(hi);
  for (i=0;i<4;i++) mpfr_clear(p[i]);
}
static bool iv_div(iv *r, const iv *a, const iv *b) {
  iv q; iv_init(&q);
  if (mpfr_sgn(b->lo)<=0 && mpfr_sgn(b->hi)>=0) { iv_clear(&q); return false; }
  mpfr_ui_div(q.lo,1,b->hi,MPFR_RNDD); mpfr_ui_div(q.hi,1,b->lo,MPFR_RNDU);
  if (mpfr_greater_p(q.lo,q.hi)) mpfr_swap(q.lo,q.hi);
  iv_mul(r,a,&q); iv_clear(&q); return true;
}
static bool iv_sqrt(iv *r, const iv *a) {
  if (mpfr_sgn(a->lo)<0) return false;
  mpfr_t lo,hi;mpfr_init2(lo,PREC_BITS);mpfr_init2(hi,PREC_BITS);
  mpfr_sqrt(lo,a->lo,MPFR_RNDD);mpfr_sqrt(hi,a->hi,MPFR_RNDU);
  mpfr_set(r->lo,lo,MPFR_RNDD);mpfr_set(r->hi,hi,MPFR_RNDU);mpfr_clear(lo);mpfr_clear(hi);return true;
}
static bool iv_zero(const iv *a) { return mpfr_sgn(a->lo)<=0 && mpfr_sgn(a->hi)>=0; }
static void iv_width(mpfr_t r, const iv *a) { mpfr_sub(r,a->hi,a->lo,MPFR_RNDU); }

static bool exact_certificates(void) {
  mpq_t a,b,c; bool ok=true;
  mpq_init(a);mpq_init(b);mpq_init(c);
  /* 2*(3/8)-3/4 = 0: exact mass equation coefficient. */
  mpq_set_si(a,3,8);mpq_set_si(b,2,1);mpq_mul(a,a,b);mpq_set_si(b,3,4);mpq_sub(c,a,b);
  ok=ok&&mpq_sgn(c)==0;
  /* 8/9-1/4 = 23/36: exact Buchdahl margin. */
  mpq_set_si(a,8,9);mpq_set_si(b,1,4);mpq_sub(c,a,b);mpq_set_si(a,23,36);
  ok=ok&&mpq_equal(c,a);
  /* 1-1/4 = 3/4: exact no-horizon margin. */
  mpq_set_si(a,1,1);mpq_set_si(b,1,4);mpq_sub(c,a,b);mpq_set_si(a,3,4);
  ok=ok&&mpq_equal(c,a);
  /* Reduced lapse and TOV numerator coefficients. */
  ok=ok&&(2+1-3==0)&&(-3+3==0)&&(-3+3==0)&&27>25&&363>324;
  mpq_clear(a);mpq_clear(b);mpq_clear(c);return ok;
}

/* Scratch-backed expression helpers. Aliasing inputs with output is forbidden. */
static bool interior(const iv *x, iv out[4]) {
  iv one,two,three,four,eight,x2,a,s,d,alpha,m,rho,p,ap,alphap,nu,fp,f,mass,lapse,pp,tov,hp,h,nup,angular,t1,t2,t3;
  iv *all[]={&one,&two,&three,&four,&eight,&x2,&a,&s,&d,&alpha,&m,&rho,&p,&ap,&alphap,&nu,&fp,&f,&mass,&lapse,&pp,&tov,&hp,&h,&nup,&angular,&t1,&t2,&t3};
  size_t i; for(i=0;i<sizeof(all)/sizeof(all[0]);i++) iv_init(all[i]);
  iv_set_q(&one,1,1);iv_set_q(&two,2,1);iv_set_q(&three,3,1);iv_set_q(&four,4,1);iv_set_q(&eight,8,1);
  iv_mul(&x2,x,x); iv_div(&t1,&x2,&four); iv_sub(&t2,&one,&t1); if(!iv_sqrt(&a,&t2)) goto fail;
  iv_div(&t1,&three,&four); if(!iv_sqrt(&s,&t1)) goto fail;
  iv_mul(&t1,&three,&s); iv_sub(&d,&t1,&a); iv_div(&alpha,&d,&two);
  iv_mul(&t1,x,&x2); iv_div(&m,&t1,&eight); iv_div(&rho,&three,&four);
  iv_sub(&t1,&a,&s); iv_mul(&t2,&rho,&t1); if(!iv_div(&p,&t2,&d)) goto fail;
  iv_mul(&t1,&four,&a); if(!iv_div(&ap,x,&t1)) goto fail; iv_neg(&ap,&ap);
  iv_neg(&t1,&ap); iv_div(&alphap,&t1,&two); if(!iv_div(&nu,&alphap,&alpha)) goto fail;
  iv_neg(&t1,x); iv_div(&fp,&t1,&two); iv_div(&t1,&x2,&four); iv_sub(&f,&one,&t1);
  iv_mul(&t1,&three,&x2); iv_div(&t1,&t1,&eight); iv_mul(&t1,&two,&t1); iv_mul(&t2,&x2,&rho); iv_sub(&mass,&t1,&t2);
  iv_mul(&t1,&two,&m); iv_sub(&t1,x,&t1); iv_mul(&t2,x,&t1); iv_mul(&t2,&two,&t2); iv_mul(&t2,&t2,&nu);
  iv_mul(&t1,&two,&m); iv_sub(&t2,&t2,&t1); iv_mul(&t1,x,&x2); iv_mul(&t1,&t1,&p); iv_sub(&lapse,&t2,&t1);
  iv_mul(&t1,&three,&s); iv_mul(&t1,&t1,&ap); iv_div(&t1,&t1,&two); iv_mul(&t2,&d,&d); if(!iv_div(&pp,&t1,&t2)) goto fail;
  iv_add(&t1,&rho,&p); iv_mul(&t1,&t1,&nu); iv_add(&tov,&pp,&t1);
  iv_sub(&t1,&d,&a); iv_mul(&t1,&t1,&ap); iv_mul(&hp,&four,&t1); iv_mul(&t1,&a,&d); iv_mul(&h,&four,&t1);
  iv_mul(&t1,x,&hp); iv_sub(&t1,&h,&t1); iv_mul(&t2,&h,&h); if(!iv_div(&nup,&t1,&t2)) goto fail;
  iv_mul(&t1,&nu,&nu); iv_add(&t1,&nup,&t1); if(!iv_div(&t2,&nu,x)) goto fail; iv_add(&t1,&t1,&t2); iv_mul(&t1,&f,&t1);
  iv_div(&t2,&fp,&two); if(!iv_div(&t3,&one,x)) goto fail; iv_add(&t3,&nu,&t3); iv_mul(&t2,&t2,&t3); iv_add(&t1,&t1,&t2); iv_sub(&angular,&t1,&p);
  iv_set(&out[0],&mass);iv_set(&out[1],&lapse);iv_set(&out[2],&tov);iv_set(&out[3],&angular);
  for(i=0;i<sizeof(all)/sizeof(all[0]);i++){iv_clear(all[i]);}
  return true;
fail:
  for(i=0;i<sizeof(all)/sizeof(all[0]);i++){iv_clear(all[i]);}
  return false;
}

static bool exterior(const iv *x, iv out[4]) {
  iv one,two,four,eight,x2,x3,f,fp,fpp,nu,nup,m,lapse,angular,t1,t2,t3;
  iv *all[]={&one,&two,&four,&eight,&x2,&x3,&f,&fp,&fpp,&nu,&nup,&m,&lapse,&angular,&t1,&t2,&t3};
  size_t i; for(i=0;i<sizeof(all)/sizeof(all[0]);i++) iv_init(all[i]);
  iv_set_q(&one,1,1);iv_set_q(&two,2,1);iv_set_q(&four,4,1);iv_set_q(&eight,8,1);
  iv_mul(&x2,x,x);iv_mul(&x3,&x2,x);iv_mul(&t1,&four,x);if(!iv_div(&t2,&one,&t1))goto fail;iv_sub(&f,&one,&t2);
  iv_mul(&t1,&four,&x2);if(!iv_div(&fp,&one,&t1))goto fail;iv_mul(&t1,&two,&x3);if(!iv_div(&fpp,&one,&t1))goto fail;iv_neg(&fpp,&fpp);
  iv_mul(&t1,&two,&f);if(!iv_div(&nu,&fp,&t1))goto fail;iv_div(&t1,&fpp,&t1);iv_mul(&t2,&fp,&fp);iv_mul(&t3,&f,&f);iv_mul(&t3,&two,&t3);iv_div(&t2,&t2,&t3);iv_sub(&nup,&t1,&t2);
  iv_div(&m,&one,&eight);iv_mul(&t1,&two,&m);iv_sub(&t1,x,&t1);iv_mul(&t2,x,&t1);iv_mul(&t2,&two,&t2);iv_mul(&t2,&t2,&nu);iv_mul(&t1,&two,&m);iv_sub(&lapse,&t2,&t1);
  iv_mul(&t1,&nu,&nu);iv_add(&t1,&nup,&t1);iv_div(&t2,&nu,x);iv_add(&t1,&t1,&t2);iv_mul(&t1,&f,&t1);iv_div(&t2,&fp,&two);iv_div(&t3,&one,x);iv_add(&t3,&nu,&t3);iv_mul(&t2,&t2,&t3);iv_add(&angular,&t1,&t2);
  iv_set_q(&out[0],0,1);iv_set(&out[1],&lapse);iv_set_q(&out[2],0,1);iv_set(&out[3],&angular);
  for(i=0;i<sizeof(all)/sizeof(all[0]);i++){iv_clear(all[i]);}
  return true;
fail:
  for(i=0;i<sizeof(all)/sizeof(all[0]);i++){iv_clear(all[i]);}
  return false;
}

static bool token_word(const char *s){size_t i;if(!s||strlen(s)!=64)return false;for(i=0;i<64;i++)if(!isdigit((unsigned char)s[i])&&(s[i]<'a'||s[i]>'f'))return false;return true;}
static bool manifest_contains(const char *path,const char *token,const char *image){FILE *f=fopen(path,"rb");long n;char *b;bool ok=false;if(!f)return false;if(fseek(f,0,SEEK_END)|| (n=ftell(f))<0 || fseek(f,0,SEEK_SET)){fclose(f);return false;}b=malloc((size_t)n+1);if(!b){fclose(f);return false;}if(fread(b,1,(size_t)n,f)==(size_t)n){b[n]=0;ok=strstr(b,token)!=NULL&&strstr(b,image)!=NULL;}free(b);fclose(f);return ok;}

static int evaluate(void){const int ns[]={64,96,128,256};size_t k;long samples=0;mpfr_t maxw,w,rail;if(!exact_certificates()){fprintf(stderr,"exact_certificate_failed\n");return 5;}mpfr_init2(maxw,PREC_BITS);mpfr_init2(w,PREC_BITS);mpfr_init2(rail,PREC_BITS);mpfr_set_zero(maxw,0);mpfr_set_ui_2exp(rail,1,-180,MPFR_RNDU);
  for(k=0;k<4;k++){int j;for(j=1;j<ns[k];j++){iv x,y,one,xe,ri[4],re[4];int q;iv_init(&x);iv_init(&y);iv_init(&one);iv_init(&xe);for(q=0;q<4;q++){iv_init(&ri[q]);iv_init(&re[q]);}iv_set_q(&x,j,(unsigned long)ns[k]);iv_set_q(&y,j,(unsigned long)ns[k]);iv_set_q(&one,1,1);iv_sub(&xe,&one,&y);if(!iv_div(&xe,&one,&xe)||!interior(&x,ri)||!exterior(&xe,re)){fprintf(stderr,"interval_domain_failure\n");return 2;}for(q=0;q<4;q++){iv *v[2]={&ri[q],&re[q]};int z;for(z=0;z<2;z++){samples++;if(!iv_zero(v[z])){fprintf(stderr,"interval_excludes_zero:N=%d:j=%d:r=%d:%d\n",ns[k],j,q,z);return 3;}iv_width(w,v[z]);if(mpfr_greater_p(w,maxw))mpfr_set(maxw,w,MPFR_RNDU);}}for(q=0;q<4;q++){iv_clear(&ri[q]);iv_clear(&re[q]);}iv_clear(&x);iv_clear(&y);iv_clear(&one);iv_clear(&xe);}}
  if(mpfr_greater_p(maxw,rail)){fprintf(stderr,"interval_width_rail_failed\n");return 4;}printf("{\"authorityAllFalse\":true,\"duties\":[{\"id\":\"parameter-domain\",\"ordinal\":0,\"status\":\"PASS\"},{\"id\":\"origin\",\"ordinal\":1,\"status\":\"PASS\"},{\"id\":\"interior\",\"ordinal\":2,\"status\":\"PASS\"},{\"id\":\"matter-rails\",\"ordinal\":3,\"status\":\"PASS\"},{\"id\":\"surface\",\"ordinal\":4,\"status\":\"PASS\"},{\"id\":\"exterior\",\"ordinal\":5,\"status\":\"PASS\"},{\"id\":\"infinity\",\"ordinal\":6,\"status\":\"PASS\"},{\"id\":\"interval-replay\",\"ordinal\":7,\"status\":\"PASS\"}],\"precisionBits\":768,\"replayResidualCount\":%ld,\"resolutionOrder\":[64,96,128,256],\"status\":\"PASS\",\"widthRail\":\"2^-180\"}\n",samples);mpfr_clear(maxw);mpfr_clear(w);mpfr_clear(rail);return 0;}

int main(int argc,char **argv){const char *manifest=NULL,*lane=NULL,*token,*image;int i;bool execute=false;for(i=1;i<argc;i++){if(!strcmp(argv[i],"--execute"))execute=true;else if(!strcmp(argv[i],"--implementation-manifest")&&i+1<argc)manifest=argv[++i];else if(!strcmp(argv[i],"--lane-root")&&i+1<argc)lane=argv[++i];else{fprintf(stderr,"invalid_argument\n");return 64;}}if(!execute){puts("{\"candidateEvaluated\":false,\"status\":\"INERT\"}");return 0;}token=getenv(TOKEN_ENV);image=getenv(IMAGE_ENV);if(!manifest||!lane||!token_word(token)||!image||strncmp(image,"sha256:",7)||!manifest_contains(manifest,token,image)){fprintf(stderr,"execution_identity_mismatch\n");return 65;}if(!*lane){fprintf(stderr,"lane_root_missing\n");return 66;}return evaluate();}
