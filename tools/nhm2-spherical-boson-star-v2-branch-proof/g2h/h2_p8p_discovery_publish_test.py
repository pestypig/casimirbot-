import unittest
from h2_p8p_discovery_publish import SinglePublisher,NoRedirect,PREFIX
from h2_p8p_discovery_diagnostic import INSTANCE
from h2_p8p_discovery_transport import encode_value
from h2_p8p_discovery_segments_test import envelope,ATTEMPT


class Response:
    def __init__(self,data=b'',status=200,flavor='Google'):
        self.data=data;self.status=status;self.headers={'Metadata-Flavor':flavor}
    def __enter__(self): return self
    def __exit__(self,*args): pass
    def read(self,cap): return self.data[:cap]


class Opener:
    def __init__(self,responses): self.responses=list(responses);self.calls=[]
    def open(self,request,**kwargs):
        self.calls.append((request,kwargs))
        response=self.responses.pop(0)
        if isinstance(response,Exception): raise response
        return response


class PublisherTests(unittest.TestCase):
    def test_exact_identity_then_single_put_and_no_retry(self):
        opener=Opener([Response(INSTANCE.encode()),Response()]);publisher=SinglePublisher(opener)
        raw=envelope(65536);result=publisher.publish(raw,ATTEMPT)
        self.assertTrue(result['published']);self.assertEqual(len(opener.calls),2)
        get,put=(call[0] for call in opener.calls)
        self.assertEqual(get.full_url,PREFIX+'id');self.assertEqual(get.get_method(),'GET')
        expected=encode_value(raw,ATTEMPT)
        self.assertEqual(put.full_url,PREFIX+'guest-attributes/'+expected['namespace']+'/receipt')
        self.assertEqual(put.get_method(),'PUT');self.assertEqual(put.data,expected['value'].encode())
        self.assertTrue(all(call[1]=={'timeout':5} for call in opener.calls))
        with self.assertRaises(RuntimeError): publisher.publish(raw,ATTEMPT)
        self.assertEqual(len(opener.calls),2)

    def test_invalid_identity_stops_before_put(self):
        for response in [Response(b'123'),Response(INSTANCE.encode()+b'\n'),
                         Response(INSTANCE.encode(),status=403),Response(INSTANCE.encode(),flavor='other')]:
            opener=Opener([response]);publisher=SinglePublisher(opener)
            with self.assertRaises(RuntimeError): publisher.publish(envelope(),ATTEMPT)
            with self.assertRaises(RuntimeError): publisher.publish(envelope(),ATTEMPT)
            self.assertEqual(len(opener.calls),1)

    def test_ambiguous_publish_failure_consumes_attempt(self):
        opener=Opener([Response(INSTANCE.encode()),TimeoutError('ambiguous')]);publisher=SinglePublisher(opener)
        with self.assertRaises(TimeoutError): publisher.publish(envelope(),ATTEMPT)
        with self.assertRaises(RuntimeError): publisher.publish(envelope(),ATTEMPT)
        self.assertEqual(len(opener.calls),2)

    def test_bad_publish_response_rejected(self):
        for response in [Response(status=500),Response(flavor='other'),Response(b'x'*1025)]:
            opener=Opener([Response(INSTANCE.encode()),response])
            with self.assertRaises(RuntimeError): SinglePublisher(opener).publish(envelope(),ATTEMPT)

    def test_invalid_payload_never_opens_network(self):
        opener=Opener([]);publisher=SinglePublisher(opener)
        with self.assertRaises(ValueError): publisher.publish(b'x'*65537,ATTEMPT)
        self.assertEqual(opener.calls,[])
        with self.assertRaises(RuntimeError): publisher.publish(envelope(),ATTEMPT)

    def test_redirect_denied(self):
        with self.assertRaises(RuntimeError): NoRedirect().redirect_request(None,None,None,None,None,None)


if __name__=='__main__':unittest.main()
