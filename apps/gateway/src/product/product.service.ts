import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { CreateProductDto } from '@repo/shared';
import { catchError, throwError } from 'rxjs';
import { IAuthUser } from 'src/auth/auth.interface';

@Injectable()
export class ProductService {
  constructor(
    @Inject('PRODUCT_MICROSERVICE') private readonly productClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.productClient.subscribeToResponseOf('create-product');
    this.productClient.subscribeToResponseOf('list-products');
    this.productClient.subscribeToResponseOf('get-product');
    await this.productClient.connect();
  }

  async onModuleDestroy() {
    await this.productClient.close();
  }

  create(createProductDto: CreateProductDto, user: IAuthUser) {
    return this.productClient
      .send(
        'create-product',
        JSON.stringify({
          ...createProductDto,
          userId: user.id,
        }),
      )
      .pipe(
        catchError((error) =>
          throwError(() => new RpcException(error.response)),
        ),
      );
  }

  list(params?: { user: IAuthUser; page: number }) {
    const { user, page } = params;
    return this.productClient
      .send('list-products', JSON.stringify({ userId: user.id, page }))
      .pipe(
        catchError((error) =>
          throwError(() => new RpcException(error.response)),
        ),
      );
  }

  get(params?: { user: IAuthUser; id: string }) {
    const { user, id } = params;
    return this.productClient
      .send('get-product', JSON.stringify({ userId: user.id, id }))
      .pipe(
        catchError((error) =>
          throwError(() => new RpcException(error.response)),
        ),
      );
  }
}