import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; app: string } {
    return { status: 'ok', app: 'qamelot' };
  }
}
