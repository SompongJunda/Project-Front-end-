import { Component, OnInit } from '@angular/core';
import { CallserviceService } from '../services/callservice.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CartService } from '../services/cart.service';
import { DataSharingService } from '../DataSharingService';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-getallorder',
  templateUrl: './getallorder.component.html',
  styleUrls: ['./getallorder.component.css'],
})
export class GetallorderComponent implements OnInit {
  updateForm: FormGroup;
  orderList: any[] = [];
  provincesData: any[] = [];
  productTypeList: any[] = [];
  userDetail: any;
  selectedProduct: any;
  ordersId: any;
  selectedpayments: any;

  constructor(
    private callService: CallserviceService,
    private sanitizer: DomSanitizer,
    private cartservice: CartService,
    private dataSharingService: DataSharingService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.updateForm = this.formBuilder.group({
      userId: '',
      address: '',
      status: '',
      phone: '',
      productId: this.formBuilder.array([]),
      quantity: this.formBuilder.array([]),
    });
  }

  ngOnInit() {
    this.cartservice.getProduct();

    // ดึงข้อมูล orderList
    this.callService.getAllOrder().subscribe((res) => {
      if (res.data) {
        this.orderList = res.data;
        console.log('ข้อมูล', this.orderList);

        this.orderList.forEach((order) => {
          this.getUserDetails(order.userId).then((userData) => {
            order.userData = userData;
          });
        });

        this.callService.getAllPaymentImage().subscribe(
          (data: any) => {
            const paymentImages = data.data;

            this.orderList.forEach((order: any) => {
              // กรองภาพการชำระเงินที่ตรงกับ ordersId ใน orderList

              order.paymentImage = paymentImages.filter(
                (payment: any) => order.ordersId === payment.ordersId
              );

              order.paymentImage.forEach((payment: any) => {
                payment.imgList = [];
                this.callService
                  .getProfileImgByUserId(payment.ordersId)
                  .subscribe((imgRes: any) => {
                    if (imgRes.data) {
                      this.getImage(imgRes.data, payment.imgList);
                    }
                  });
              });
            });

            // Log เพื่อตรวจสอบข้อมูล
            console.log('orderList with payment images', this.orderList);
          },
          (error: any) => {
            console.error('Error fetching payment images', error);
          }
        );

        // เรียกฟังก์ชัน getAllProduct() หลังจากดึง orderList แล้ว
        this.callService.getAllProduct().subscribe((res: any) => {
          if (res.data) {
            const allProducts = res.data;
            // เพิ่ม productList ในแต่ละ order
            this.orderList.forEach((order: any) => {
              order.productList = allProducts.filter((product: any) =>
                order.productId.includes(product.productId)
              );

              order.productList.forEach((product: any) => {
                product.imgList = [];
                this.callService
                  .getProductImgByProductId(product.productId)
                  .subscribe((imgRes) => {
                    if (imgRes.data) {
                      this.getImageList(imgRes.data, product.imgList);
                    }
                  });
              });
            });
          }
        });
      }
    });

    this.dataSharingService.userDetail.subscribe((value) => {
      const userDetailSession: any = sessionStorage.getItem('userDetail');
      this.userDetail = JSON.parse(userDetailSession);
    });

    this.dataSharingService.userDetail.subscribe((value) => {
      const userDetailSession: any = sessionStorage.getItem('userDetail');
      this.userDetail = JSON.parse(userDetailSession);
    });
  }

  getImage(imageNames: any[], imgList: any[]) {
    for (let imageName of imageNames) {
      this.callService
        .getProfileImgBlobThumbnail(imageName.profileImgName)
        .subscribe((res) => {
          if (res) {
            let objectURL = URL.createObjectURL(res);
            let safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
            imgList.push(safeUrl);
          }
        });
    }
  }
  payments(payment: any) {
    this.selectedpayments = payment;
    console.log('Selected Product:', this.selectedpayments);
  }
  getProductTypeAll() {
    this.callService.getProductTypeAll().subscribe((res) => {
      if (res.data) {
        this.productTypeList = res.data;
      }
    });
  }

  getImageList(imageNames: any[], imgList: any[]) {
    for (let imageName of imageNames) {
      this.callService
        .getBlobThumbnail(imageName.productImgName)
        .subscribe((res) => {
          if (res) {
            let objectURL = URL.createObjectURL(res);
            let safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
            imgList.push(safeUrl);
          }
        });
    }
  }

  getUserDetails(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.callService.getByUserId(userId).subscribe((response) => {
        if (response.status === 'SUCCESS') {
          resolve(response.data);
        } else {
          reject('Error fetching user details');
        }
      });
    });
  }

  getQuantity(order: any, productId: number): number {
    const productIndex = order.productId.indexOf(productId);
    return productIndex > -1 ? order.quantity[productIndex] : 0;
  }

  onDeleteOrder(ordersId: any) {
    if (ordersId) {
      this.callService.deleteOrder(ordersId).subscribe((res) => {
        if (res.data) {
          window.location.reload();
        }
      });
    }
  }

  setDataForm(selectedProduct: any): void {
    this.updateForm.patchValue({
      userId: selectedProduct.userId,
      address: selectedProduct.address,
      phone: selectedProduct.phone,
      status: selectedProduct.status,
    });

    this.updateForm.setControl(
      'productId',
      this.formBuilder.array(selectedProduct.productId || [])
    );
    this.updateForm.setControl(
      'quantity',
      this.formBuilder.array(selectedProduct.quantity || [])
    );
  }

  setSelectedProduct(order: any): void {
    this.selectedProduct = order;
    console.log('Selected Product:', this.selectedProduct);
    this.setDataForm(order);
  }

  onSubmit(): void {
    console.log('Form Values:', this.updateForm.value);

    const order = this.updateForm.value;

    console.log('Request Payload:', {
      order: order,
      ordersId: this.selectedProduct.ordersId,
    });

    this.callService
      .updateOrder(order, this.selectedProduct.ordersId)
      .subscribe(
        (res) => {
          console.log('Response:', res);
          if (res.data) {
            Swal.fire({
              icon: 'success',
              title: 'สำเร็จ!',
              text: 'แก้ไขข้อมูลสำเร็จ',
              confirmButtonText: 'ตกลง',
            }).then((result) => {
              if (result.isConfirmed) {
                window.location.reload();
              }
            });
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'บันทึกไม่สำเร็จ!',
              text: 'กรุณาตรวจสอบข้อมูล ด้วยค่ะ',
              confirmButtonText: 'ตกลง',
            });
          }
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาด!',
            text: 'เกิดข้อผิดพลาดในการส่งข้อมูล',
            confirmButtonText: 'ตกลง',
          });
          console.error('Error:', error);
        }
      );
  }
}
