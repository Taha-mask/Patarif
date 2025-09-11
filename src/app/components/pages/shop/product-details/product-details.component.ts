import { Component, ElementRef, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
import { AuthService } from '../../../../services/auth.service';
import { LoadingComponent } from "../../../loading/loading.component";

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, BackgroundComponent, HomeFooterComponent, CartButtonComponent, StarsBackgroundComponent, LinesBackgroundComponent, LoadingComponent],
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
    private authService: AuthService,
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
async handleAddToCart(event: Event) {
  event.preventDefault();

  if (await this.authService.isLoggedIn()) {
    this.addToCart();
  } else {
    Swal.fire({
      title: 'Vous devez vous connecter',
      text: 'Vous devez avoir un compte pour ajouter des articles au panier.',
      icon: 'warning',
      confirmButtonText: 'Connexion'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/login']);
      }
    });
  }
}

addToCart() {
  if (!this.selectedColor || !this.selectedSize) {
    Swal.fire({
      title: 'Sélectionnez les options',
      text: 'Veuillez sélectionner la couleur et la taille avant d’ajouter au panier.',
      icon: 'info',
      confirmButtonText: 'OK'
    });
    return;
  }

  const newItem: CartItem = {
    id: this.product.id,
    name: this.product.title,
    color: this.selectedColor,
    size: this.selectedSize,
    maxQuantity: this.maxQuantity,
    price: this.product.final_price,
    quantity: 1,
    image: this.selectedImage
  };

  const added = this.dataService.addToCart(newItem);

  if (added) {
    Swal.fire({
      title: 'Ajouté au panier',
      text: `${this.product.title} a été ajouté à votre panier.`,
      icon: 'success',
      confirmButtonText: 'OK'
    });
  } else {
    Swal.fire({
      title: 'Déjà dans le panier',
      text: 'Cet article est déjà dans votre panier. Vous pouvez augmenter la quantité depuis la page du panier.',
      icon: 'info',
      confirmButtonText: 'Aller au panier'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/cart']);
      }
    });
  }
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

  @ViewChild('mainImg') mainImgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('mainImgWrapper') mainWrapperRef!: ElementRef<HTMLDivElement>;

  // قابل للتعديل:
  magnifierSize = 220; // px قطر العدسة
  zoom = 2.5; // عامل التكبير

  magnifierStyle: any = { display: 'none' }; // تستخدمها ngStyle

  // استدعي هذه الدوال من الـ template كما في الأعلى
  onImageEnter() {
    this.magnifierStyle = { ...this.magnifierStyle, display: 'block' };
  }

  onImageLeave() {
    this.magnifierStyle = { display: 'none' };
  }

  onImageMouseMove(event: MouseEvent) {
    const imgEl = this.mainImgRef?.nativeElement;
    const wrapperEl = this.mainWrapperRef?.nativeElement;
    if (!imgEl || !wrapperEl) return;

    const rect = imgEl.getBoundingClientRect();

    // إحداثيات الماوس بالنسبة للصورة
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // لو برا الصورة نخفي العدسة
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      this.onImageLeave();
      return;
    }

    // حجم الخلفية للمساحة المكبرة
    const bgWidth = rect.width * this.zoom;
    const bgHeight = rect.height * this.zoom;

    // حساب موقع الخلفية بحيث يكون نقطة الماوس في مركز العدسة
    const bgPosX = -(x * this.zoom - this.magnifierSize / 2);
    const bgPosY = -(y * this.zoom - this.magnifierSize / 2);

    // نريد وضع العدسة جنب الماوس — نحسب موضع العدسة داخل wrapper
    // left و top تكون نسبة للأحجام المعروضة (الـ rect)
    let left = (x + 20); // 20px فاصلة عن المؤشر باتجاه يمين الصورة
    let top = (y - this.magnifierSize / 2);

    // نتأكد العدسة لا تخرج من حدود الwrapper (حتى لو قربنا من الحواف)
    left = Math.min(left, rect.width - this.magnifierSize);
    left = Math.max(left, 0);
    top = Math.min(Math.max(top, 0), rect.height - this.magnifierSize);

    // نحول الموقع من إحداثيات داخل الصورة إلى px بالنسبة للـ .main-img (wrapper)
    // لأن rect.left هي بداية الصورة، والأرقام فوق هي بالنسبة للصورة فعلاً
    this.magnifierStyle = {
      display: 'block',
      width: `${this.magnifierSize}px`,
      height: `${this.magnifierSize}px`,
      left: `${left}px`,
      top: `${top}px`,
      backgroundImage: `url(${this.selectedImage})`, // استخدم الصورة الحالية
      backgroundSize: `${bgWidth}px ${bgHeight}px`,
      backgroundPosition: `${bgPosX}px ${bgPosY}px`,
    };
  }
}
