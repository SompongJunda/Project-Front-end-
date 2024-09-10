import { TestBed } from '@angular/core/testing';
import { CallserviceService } from './callservice.service';

// import { CallserviceService } from './CallserviceService';

describe('CallserviceService', () => {
  let service: CallserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
