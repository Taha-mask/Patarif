import { Component, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../../../services/products.service';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from "../../../background/background.component";
import { HomeFooterComponent } from "../../home/home-footer/home-footer.component";

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, BackgroundComponent, HomeFooterComponent],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {

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
      // Fetch sizes for this specific color
      this.sizes = await this.productsService.getSizesByColorId(colorId);
    } catch (err) {
      console.error(err);
    }
  }

  selectSize(size: string) {
    this.selectedSize = size;
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
    return offer.toFixed(); // return percentage as string
  }

  convertFinalPriceTo99(final_price: number): number {
    return Math.floor(final_price - 1) + 0.99; // format price like x.99
  }

  // ==========================
  // Constructor
  // ==========================
  constructor(
    private route: ActivatedRoute,
    public productsService: ProductsService,
    private router: Router
  ) { }

  // ==========================
  // On Init
  // ==========================
  async ngOnInit() {
    setTimeout(() => {
      const el = document.getElementById('myTargetDiv');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      console.error('Product ID not found in route parameters');
      this.loading = false;
      return;
    }

    try {
      const product = await this.productsService.getProductById(id);

      if (product) {
        this.product = product;
        console.log('Fetched product:', this.product);

        // Extract colors with both id and color_code
        this.colors = this.product?.product_colors?.map((c: any) => ({
          id: c.id,
          color_code: c.color_code
        })) || [];

        // Initially sizes are empty until a color is selected
        this.sizes = [];

        // Calculate total stock (across all colors and sizes)
        this.productStock = 0;

        // Check if product has colors
        if (this.product?.product_colors?.length) {
          for (const color of this.product.product_colors) {
            // Check if this color has sizes
            if (color?.product_sizes?.length) {
              for (const size of color.product_sizes) {
                // Make sure stock exists and is a number
                this.productStock += Number(size.stock) || 0;
              }
            }
          }
        }
        // update main image [selected]
        this.selectedImage = this.product?.images[0];
        // Update availability flag
        this.isProductStockAvailable = this.productStock > 0;


        // Setup rating stars if product has rating
        if (this.product.rate !== undefined && this.product.rate !== null) {
          this.setStars(this.product.rate);
        }

      } else {
        console.error('Product not found');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      this.loading = false;
    }
  }
}
