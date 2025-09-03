import { Component, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../../../services/products.service';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from "../../../background/background.component";
import { CartButtonComponent } from "../cart-button/cart-button.component";
import Swal from 'sweetalert2';
import { CartItem, CartService } from '../../../../services/data.service';
import { ɵEmptyOutletComponent } from "../../../../../../node_modules/@angular/router/router_module.d-Bx9ArA6K";
import { HomeFooterComponent } from '../../home/home-footer/home-footer.component';
import { StarsBackgroundComponent } from "../../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../../lines-background/lines-background.component";
import { SupabaseService } from '../../../../supabase.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, BackgroundComponent, HomeFooterComponent, CartButtonComponent, StarsBackgroundComponent, LinesBackgroundComponent],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  maxQuantity: number = 0;

  // ==========================
  // Product core data
  // ==========================
  product: any;
  loading: boolean = true;

  // ==========================
  // Images
  // ==========================
  selectedImage!: string;

  // ==========================
  // Ratings (stars)
  // ==========================
  fullStars: number[] = [];
  hasHalfStar: boolean = false;
  emptyStars: number[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rate'] && changes['rate'].currentValue !== undefined) {
      this.setStars(changes['rate'].currentValue);
    }
  }

  setStars(rating: number) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    this.fullStars = Array(full).fill(0);
    this.hasHalfStar = half;
    this.emptyStars = Array(empty).fill(0);
  }

  // ==========================
  // Colors & Sizes
  // ==========================
  colors: { id: string, color_code: string }[] = [];
  selectedColor!: string;

  sizes: any[] = [];
  selectedSize: string | null = null;

  selectColor(colorCode: string) {
    this.selectedColor = colorCode;
  }

  async onColorClick(colorId: string) {
    this.selectedSize = null;
    try {
      this.sizes = await this.productsService.getSizesByColorId(colorId);
    } catch (err) {
      console.error(err);
    }
  }

  selectSize(size: string, stock: number) {
    this.selectedSize = size;
    this.maxQuantity = stock;
  }

  // ==========================
  // Stock & Availability
  // ==========================
  productStock: number = 0;
  isProductStockAvailable: boolean = true;

  // ==========================
  // Wishlist (Favourite)
  // ==========================
  isFavourite: boolean = false;

  // ==========================
  // Price Helpers
  // ==========================
  calcOffer(final_price: number, old_price: number): string {
    const offer = ((old_price - final_price) / old_price) * 100;
    return offer.toFixed();
  }

  convertFinalPriceTo99(final_price: number): number {
    return Math.floor(final_price - 1) + 0.99;
  }

  // ==========================
  // Constructor
  // ==========================
  constructor(
    private route: ActivatedRoute,
    private supabaseServices: SupabaseService,
    public productsService: ProductsService,
    private router: Router,
    private dataService: CartService
  ) { }

  // ==========================
  // On Init
  // ==========================
  email: string = '';
  async ngOnInit() {
    const user = await this.supabaseServices.getCurrentUser();
    if (user) {
      this.email = user.email ?? 'email not found';
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      console.error('Product ID not found in route parameters');
      this.loading = false;
      return;
    }

    try {
      this.loading = true;
      const product = await this.productsService.getProductById(id);

      if (product) {
        this.product = product;

        this.colors = this.product?.product_colors?.map((c: any) => ({
          id: c.id,
          color_code: c.color_code
        })) || [];

        this.sizes = [];
        this.productStock = 0;

        if (this.product?.product_colors?.length) {
          for (const color of this.product.product_colors) {
            if (color?.product_sizes?.length) {
              for (const size of color.product_sizes) {
                this.productStock += Number(size.stock) || 0;
              }
            }
          }
        }

        // ✅ دلوقتي بعد ما عندك email و product.id
        const checkFav = await this.supabaseServices.isInFavourites(this.email, this.product.id);
        this.isFavourite = checkFav === true;
      }
    } catch (err) {
      console.error('Error loading product:', err);
    } finally {
      this.loading = false;
    }
    this.selectedImage = this.product.images[0];

    setTimeout(() => {
      const el = document.getElementById('myTargetDiv');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }


  // ==========================
  // Cart
  // ==========================
  addToCart() {
    const newItem: CartItem = {
      id: this.product.id,
      name: this.product.title,
      color: this.selectedColor,
      size: this.selectedSize || 'null',
      maxQuantity: this.maxQuantity,
      price: this.product.final_price,
      quantity: 1,
      image: this.selectedImage
    };
    this.dataService.addToCart(newItem);
  }

  // ==========================
  // favourites
  // ==========================


  addToFav() {
    if (this.isFavourite == false) {

      this.supabaseServices.addToFavourites(this.email, this.product.id);
      this.isFavourite = !this.isFavourite;

    } else {
      this.supabaseServices.removeFromFavourites(this.email, this.product.id);

      this.isFavourite = !this.isFavourite;
    }
  }
}
