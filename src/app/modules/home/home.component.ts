import { Component, OnInit } from '@angular/core';
import { CallserviceService } from '../services/callservice.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  cartItems: any[] = [];
  totalCost: number = 0;
  productList: any[] = [];
  productTypeList: any[] = [];
  isCartVisible: boolean = false;

  constructor(
    private callService: CallserviceService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  imageBlobUrl: any;
  imageBlobUrls: any = [];
  productImgList: any;

  ngOnInit() {
    this.getProductTypeAll();
    this.getCartItems();
    this.getAllProducts();

    this.callService.getAllProduct().subscribe((res) => {
      if (res.data) {
        this.productList = res.data;
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
        }
      }
    });
  }

  getAllProducts() {
    this.callService.getAllProduct().subscribe((res) => {
      if (res.data) {
        this.productList = res.data;
        for (let product of this.productList) {
          product.imgList = [];
          if (typeof product.quantityToAdd === 'undefined') {
            product.quantityToAdd = 1; // ตั้งค่าเริ่มต้นของ quantityToAdd ถ้ายังไม่ถูกตั้งค่า
          }
          product.productType = this.productTypeList.find(
            (x) => x.id === product.productTypeId
          );
          this.getProductImages(product.productId, product.imgList);
        }
      }
    });
  }
  getProductImages(productId: number, imgList: SafeResourceUrl[]) {
    this.callService.getProductImgByProductId(productId).subscribe((resImg) => {
      if (resImg.data) {
        let productImgList = resImg.data;
        for (let productImg of productImgList) {
          this.getImage(productImg.productImgName, imgList);
        }
      } else {
        window.location.reload();
      }
    });
  }
  getCartItems() {
    let storedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    this.cartItems = storedCartItems;
    this.calculateTotalCost();
  }

  calculateTotalCost() {
    this.totalCost = this.cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
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

  addToCart(productId: number, quantity: number) {
    const product = this.productList.find((p) => p.productId === productId);

    if (product) {
      const cartItem = {};

      Swal.fire({
        icon: 'error',
        title: 'ต้องเข้าสู่ระบบก่อน',
        width: 300,
        padding: '1em',
        color: '#716add',
        background: '#fff url(/images/trees.png)',
        backdrop: `
          rgba(0,0,123,0.4)
        
          left top
          no-repeat
        `,
      });
    }
  }
}
