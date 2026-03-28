import { DefaultBodyType, PathParams, ResponseComposition, RestContext, RestRequest } from 'msw';

declare global {
  type MockHandler = (
    req: RestRequest<DefaultBodyType, PathParams>,
    res: ResponseComposition<DefaultBodyType>,
    ctx: RestContext
  ) => Promise<any> | any;
}
