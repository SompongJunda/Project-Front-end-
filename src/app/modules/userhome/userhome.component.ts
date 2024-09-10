import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CallserviceService } from '../services/callservice.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DataSharingService } from '../DataSharingService';
import { CartService } from '../services/cart.service';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-userhome',
  templateUrl: './userhome.component.html',
  styleUrls: ['./userhome.component.css'],
})
export class UserhomeComponent implements OnInit {
  cartItems: any[] = [];
  totalCost: number = 0;
  productList: any;
  filteredProductList: any; // Add this variable to store filtered products
  productTypeList: any[] = [];
  isCartVisible: boolean = false;
  userDetail: any;
  imageBlobUrl: any;
  imageBlobUrls: any = [];
  productImgList: any;
  selectedProduct: any;
  searchText: string = ''; // Add this variable to store search text

  constructor(
    private callService: CallserviceService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private dataSharingService: DataSharingService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.getProductTypeAll();

    this.callService.getAllProduct().subscribe((res) => {
      if (res.data) {
        this.productList = res.data;
        this.filteredProductList = this.productList; // Initialize the filtered list
        for (let product of this.productList) {
          product.imgList = [];
          product.productType = this.productTypeList.filter(
            (x: any) => x.productTypeId == product.productTypeId
          );
          if (null == product.productType[0]) {
            window.location.reload();
          }

          this.callService
            .getProductImgByProductId(product.productId)
            .subscribe((res) => {
              if (res.data) {
                this.productImgList = res.data;
                for (let productImg of this.productImgList) {
                  this.getImage(productImg.productImgName, product.imgList);
                }
              } else {
                window.location.reload();
              }
            });

          this.dataSharingService.userDetail.subscribe((value) => {
            var userDetailSession: any = sessionStorage.getItem('userDetail');
            this.userDetail = JSON.parse(userDetailSession);
          });
        }
      }
    });

    var userDetailSession: any = sessionStorage.getItem('userDetail');
    this.userDetail = JSON.parse(userDetailSession);
  }

  getProductImages(productId: number, imgList: SafeResourceUrl[]) {
    this.callService.getProductImgByProductId(productId).subscribe((resImg) => {
      if (resImg.data) {
        let productImgList = resImg.data;
        for (let productImg of productImgList) {
          this.getImage(productImg.productImgName, imgList);
        }
      } else {
      }
    });
  }

  getImage(fileNames: any, imgList: any) {
    this.callService.getBlobThumbnail(fileNames).subscribe((res) => {
      let objectURL = URL.createObjectURL(res);
      this.imageBlobUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
      imgList.push(this.imageBlobUrl);
    });
  }

  getProductTypeAll() {
    this.callService.getProductTypeAll().subscribe((res) => {
      if (res.data) {
        this.productTypeList = res.data;
      }
    });
  }

  setSelectedProduct(product: any) {
    this.selectedProduct = product;
  }

  async addtoCart(productId: any): Promise<void> {
    try {
      await this.cartService.addToCart(productId);
      await Swal.fire({
        icon: 'success',
        title: 'เพิ่มสำเร็จ!',
        text: 'สินค้าได้ถูกเพิ่มในรถเข็น',
        confirmButtonText: 'ตกลง',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถเพิ่มสินค้าในรถเข็น กรุณาลองใหม่อีกครั้ง',
        confirmButtonText: 'ตกลง',
      });
    }
  }

  addToCart(product: any) {
    console.log('Product added to cart:', product);
  }

  searchProduct() {
    this.filteredProductList = this.productList.filter((product: any) => {
      return (
        product.productName
          .toLowerCase()
          .includes(this.searchText.toLowerCase()) ||
        product.productDesc
          .toLowerCase()
          .includes(this.searchText.toLowerCase())
      );
    });
  }
}
