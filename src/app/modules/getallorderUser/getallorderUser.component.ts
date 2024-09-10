import { Component, OnInit } from '@angular/core';
import { CallserviceService } from '../services/callservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
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
  selector: 'app-getallorderUser',
  templateUrl: './getallorderUser.component.html',
  styleUrls: ['./getallorderUser.component.css'],
})
export class GetallorderUserComponent implements OnInit {
  public shippingCost: number = 40;
  public grandTotal: number = 0;
  public productList: CartItem[] = [];
  constructor(
    private callService: CallserviceService,
    private activated: ActivatedRoute,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}
  updateForms = this.formBuilder.group({
    userId: '',
    address: '',
    status: '',
    phone: '',
    productId: this.formBuilder.array([]),
    quantity: this.formBuilder.array([]),
  });
  updateForm = this.formBuilder.group({
    files: [],
  });
  userId: any;
  orderList: any[] = [];
  userDetail: any;
  selectedProduct: any;
  selectedProducts: number;
  provincesData: any[] = [];
  promprayNumber = '0630585085';
  linkPrompray: string = '';
  delFile: any = [];
  selectedFiles: any = [];
  imageBlobUrl: any;
  ImageList: any = [];
  isSubmit: boolean = false;
  selectedpayments: any;

  ngOnInit() {
    this.getData();
    let userDetailSession: any = sessionStorage.getItem('userDetail');
    this.userDetail = JSON.parse(userDetailSession);
    const reloadKey = 'profilePageReloaded';
    const hasReloaded = sessionStorage.getItem(reloadKey);
    // --------------------------------

    // ------------------------------
    this.callService
      .getOrderIdByUserId(this.userDetail.userId)
      .subscribe((res) => {
        if (res.data) {
          this.orderList = res.data;
          console.log('orderList', res.data);
          this.orderList.forEach((order) => {
            this.getUserDetails(order.userId).then((userData) => {
              order.userData = userData;
            });
          });

          // เรียกฟังก์ชัน getAllProduct() หลังจากดึง orderList แล้ว
          this.callService.getAllProduct().subscribe((res: any) => {
            if (res.data) {
              const allProducts = res.data;

              // เพิ่ม productList ในแต่ละ order
              this.orderList.forEach((order: any) => {
                order.productList = allProducts.filter((product: any) =>
                  order.productId.includes(product.productId)
                );
                console.log('productList', order.productList);
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
          this.updateGrandTotal();
        }
      });
  }
  setSelectedProducts(order: any, total: number): void {
    this.selectedProduct = order;
    this.selectedProducts = total;
    console.log('Selected Product:', this.selectedProduct);
    console.log('Selected Products:', this.selectedProducts);
    this.getData();
  }

  updateGrandTotal(): void {
    this.grandTotal =
      this.orderList.reduce(
        (total, order) => total + this.calculateOrderTotal(order),
        0
      ) + this.shippingCost;
    console.log('grandTotal', this.grandTotal);
    this.getData();
    // เรียก getData() เพื่ออัปเดตลิงก์ PromptPay ทันทีหลังจากอัปเดตราคาสุดท้าย
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

  calculateOrderTotal(order: any): number {
    return order.productList.reduce(
      (total: number, product: any) =>
        total + product.price * this.getQuantity(order, product.productId),
      0
    );
  }

  getData() {
    this.linkPrompray = `https://promptpay.io/${this.promprayNumber}/${this.selectedProducts}.png`;
    console.log(this.linkPrompray);
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

  setSelectedProduct(order: any): void {
    this.selectedProduct = order;
    console.log('Selected Product:', this.selectedProduct);
    this.setDataForm(order);
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
    this.updateForms.patchValue({
      userId: selectedProduct.userId,
      address: selectedProduct.address,
      phone: selectedProduct.phone,
      status: selectedProduct.status,
    });

    this.updateForms.setControl(
      'productId',
      this.formBuilder.array(selectedProduct.productId || [])
    );
    this.updateForms.setControl(
      'quantity',
      this.formBuilder.array(selectedProduct.quantity || [])
    );
  }

  onSubmit(): void {
    console.log('Form Values:', this.updateForms.value);

    const order = this.updateForms.value;

    console.log('Request Payload:', {
      order: order,
      ordersId: this.selectedProduct.ordersId,
    });

    this.callService
      .updateOrder(order, this.selectedProduct.ordersId)
      .subscribe((res) => {
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
      });
  }

  onButton(orders: any) {
    const requests = [];

    for (const file of this.selectedFiles[0]) {
      const formData = new FormData();
      formData.append('file', file);

      // เก็บผลลัพธ์ของการสมัครสมาชิกแต่ละตัว
      requests.push(
        this.callService
          .saveProfileImgUserId(formData, orders.ordersId)
          .toPromise()
      );
    }

    Promise.all(requests)
      .then((responses) => {
        console.log('saveImage=>', responses);

        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'บันทึกข้อมูลสำเร็จ',
          confirmButtonText: 'ตกลง',
        }).then((result) => {
          if (result.isConfirmed) {
            // อัปเดต UI หรือทำการกระทำอื่น ๆ แทนการรีเฟรชหน้า
            window.location.reload();
          }
        });
      })
      .catch((error) => {
        console.error('Error saving images:', error);
        Swal.fire({
          icon: 'error',
          title: 'ผิดพลาด!',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
          confirmButtonText: 'ตกลง',
        });
      });
  }

  onFileChanged(event: any) {
    this.selectedFiles.push(event.target.files);
  }

  onDeleteFileChanged(fileName: any) {
    let dataList = [];
    for (let image of this.ImageList) {
      if (image.key != fileName) {
        dataList.push(image);
      } else {
        this.delFile.push(image.key);
      }
    }
    this.ImageList = dataList;
    console.log(' this.delFile', this.delFile);
  }
  setSubmit() {
    this.isSubmit = false;
  }
}
