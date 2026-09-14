# Automatic UI late-response isolation

O4/O5 presentation lifecycle evidence under the
[onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Added four rendered component cases: account/chat switch while automatic
issuance is pending, and account/chat switch while delivery is pending. A valid
late successful response is then released. Late issuance causes no follow-on
delivery request. Late delivery causes no further request or restored old
pairing/receipt display. New-selection approval remains unchecked and no runtime
binding callback fires. An already-issued delivery is not claimed to be undone.

All 24 DurableTaskPairing component tests pass. This uses mocked HTTP responses;
it complements but does not replace real-handler browser and native workflow
qualification. No production fix was required for these four cases. Unknown-
outcome/reload automatic UI composition and actual host delivery remain open,
along with the complete original onboarding and environment acceptance scope.
