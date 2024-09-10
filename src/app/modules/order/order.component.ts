import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CallserviceService } from '../services/callservice.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

interface CartItem {
  productId: number;
  productTypeId: number;
  productName: string;
  productDesc: string;
  price: number;
  imgList: string[];
  quantity: number;
}

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css'],
})
export class OrderComponent implements OnInit {
  public shippingCost: number = 40; // ค่าจัดส่ง
  public totalItem: number = 0;
  public productList: CartItem[] = [];
  public imageBlobUrl: any;
  public grandTotal: number = 0;

  constructor(
    private cartservice: CartService,
    private callService: CallserviceService,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private router: Router,
    private activated: ActivatedRoute
  ) {}

  userDetail: any;
  userId: any;
  quantity: number[] = [];
  productId: number[] = [];
  responseData: any;

  orderForm: FormGroup = this.formBuilder.group({
    productId: [],
    quantity: [],
    address: '',
    userId: '',
    phone: '',
  });

  ngOnInit() {
    this.activated.queryParams.subscribe((params) => {
      this.productList = params['responseData']
        ? JSON.parse(params['responseData'])
        : null;
      console.log('productList', this.productList);
      for (let product of this.productList) {
        this.callService
          .getProductImgByProductId(product.productId)
          .subscribe((res) => {
            if (res.data) {
              product.imgList = [];
              this.getImageList(res.data, product.imgList);
            } else {
              window.location.reload();
            }
          });
      }
      this.updateGrandTotal();
      this.loadUserDetails();
    });

    // -----------------------------------------
    this.userId = this.activated.snapshot.paramMap.get('userId');

    // this.activated.queryParams.subscribe((params) => {
    //   this.productList = params['responseData']
    //     ? JSON.parse(params['responseData'])
    //     : null;
    //   console.log('productList', this.productList);

    // this.loadProducts();

    // });
  }

  // loadProducts() {
  //   this.cartservice.getProduct().subscribe((res) => {
  //     this.productList = res.map((item: any) => ({ ...item, quantity: 1 }));

  //     for (let product of this.productList) {
  //       this.loadProductImage(product);
  //     }

  //     this.cartservice.getProduct().subscribe((res) => {
  //       this.totalItem = res.length;
  //     });

  //     this.updateGrandTotal();
  //   });
  // }

  loadProductImage(product: any) {
    this.callService
      .getProductImgByProductId(product.productId)
      .subscribe((res) => {
        if (res.data) {
          product.imgList = [];
          this.getImageList(res.data, product.imgList);
        } else {
          window.location.reload();
        }
      });
  }

  loadUserDetails() {
    if (this.userId) {
      this.callService.getByUserId(this.userId).subscribe((res) => {
        if (res.data) {
          this.userDetail = res.data;
          this.setDataForm(this.userDetail);
        }
      });
    } else {
      let userDetailSession: any = sessionStorage.getItem('userDetail');
      this.userDetail = JSON.parse(userDetailSession);
      this.setDataForm(this.userDetail);

      console.log('userId', this.userDetail.userId);
    }
  }

  getImageList(imageNames: any[], imgList: any) {
    for (let imageName of imageNames) {
      this.callService
        .getBlobThumbnail(imageName.productImgName)
        .subscribe((res) => {
          let objectURL = URL.createObjectURL(res);
          this.imageBlobUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
          imgList.push(this.imageBlobUrl);
        });
    }
  }

  updateGrandTotal(): void {
    this.grandTotal = this.productList.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }

  setDataForm(data: any) {
    this.orderForm.patchValue({
      userId: data.userId,
      address: data.address || '',
      phone: data.phone || '',
    });
  }

  getUserById(userId: any) {
    this.callService.getByUserId(userId).subscribe((res) => {
      if (res.data) {
        this.setDataForm(res.data);
        sessionStorage.removeItem('userDetail');
        sessionStorage.setItem('userDetail', JSON.stringify(res.data));
      }
    });
  }

  onSubmit() {
    this.productId = this.productList.map((item) => item.productId);
    this.orderForm.patchValue({ productId: this.productId });

    this.quantity = this.productList.map((item) => item.quantity);
    this.orderForm.patchValue({ quantity: this.quantity });

    console.log(this.orderForm.value);

    const data = this.orderForm.value;
    Swal.fire({
      title: 'ต้องการสั่งซื้อ',
      text: 'คุณต้องการสั่งซื้อใช้หรือไม่!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#56C596',
      cancelButtonColor: '#d33',
      confirmButtonText: 'สั่งซื้อ',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        this.callService.saveOrder(data).subscribe((res) => {
          if (res.data) {
            Swal.fire({
              icon: 'success',
              title: 'สำเร็จ!',
              text: 'สั่งซื้อสำเร็จ',
              confirmButtonText: 'ตกลง',
            }).then((ress) => {
              this.router.navigate(['/getallorderuser']);
            });
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'บันทึกไม่สำเร็จ!',
              text: 'กรุณาตรวจสอบข้อมูล ด้วยค่ะ',
              confirmButtonText: 'ตกลง',
            });
          }
        });
      }
    });
  }
}
