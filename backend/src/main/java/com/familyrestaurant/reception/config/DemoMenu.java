package com.familyrestaurant.reception.config;

import com.familyrestaurant.reception.model.MenuItem;
import com.familyrestaurant.reception.model.SeedState;
import com.familyrestaurant.reception.repository.MenuItemRepository;
import com.familyrestaurant.reception.repository.SeedStateRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
public class DemoMenu {
    private static final String ROLL_MENU_VERSION = "photo-roll-menu-v1";
    private static final String OLD_DEMO_VERSION = "demo-menu-v1";

    private static final List<SeedItem> OLD_DEMO_ITEMS = List.of(
            roll("Classic Veg Roll", "Veg Rolls", "149.00"),
            roll("Paneer Tikka Roll", "Veg Rolls", "199.00"),
            roll("Cheese Corn Roll", "Veg Rolls", "179.00"),
            roll("Egg Roll", "Non-Veg Rolls", "169.00"),
            roll("Chicken Tikka Roll", "Non-Veg Rolls", "229.00"),
            roll("Peri Peri Fries", "Sides", "129.00"),
            roll("Masala Fries", "Sides", "119.00"),
            roll("Fresh Lime Soda", "Drinks", "79.00"),
            roll("Cold Coffee", "Drinks", "119.00")
    );

    private static final List<SeedItem> PHOTO_ROLLS = List.of(
            // Veg Roll column in the supplied printed menu.
            roll("Veg Roll", "Veg Rolls", "100.00"),
            roll("Paneer Roll", "Veg Rolls", "110.00"),
            roll("Dbl Paneer Roll", "Veg Rolls", "150.00"),
            roll("Paneer Tikka Roll", "Veg Rolls", "160.00"),
            roll("Mushroom Roll", "Veg Rolls", "130.00"),
            roll("Cheese Roll", "Veg Rolls", "140.00"),
            roll("Paneer Cheese Roll", "Veg Rolls", "170.00"),
            roll("Dbl Paneer Cheese Roll", "Veg Rolls", "200.00"),

            // Non Veg Roll column below the veg rolls.
            roll("Egg Roll", "Non-Veg Rolls", "80.00"),
            roll("Dbl Egg Roll", "Non-Veg Rolls", "90.00"),
            roll("Chicken Roll", "Non-Veg Rolls", "100.00"),
            roll("Dbl Chicken Roll", "Non-Veg Rolls", "130.00"),
            roll("Chicken Egg Roll", "Non-Veg Rolls", "110.00"),
            roll("Dbl Egg Chicken Roll", "Non-Veg Rolls", "120.00"),
            roll("Dbl Chicken Egg Roll", "Non-Veg Rolls", "150.00"),
            roll("Dbl Egg Dbl Chicken Roll", "Non-Veg Rolls", "160.00"),
            roll("Chicken Kathi Roll", "Non-Veg Rolls", "130.00"),
            roll("Chicken Kathi Egg Roll", "Non-Veg Rolls", "140.00"),
            roll("Dbl Chicken Kathi Roll", "Non-Veg Rolls", "170.00"),
            roll("Dbl Chicken Kathi Egg Roll", "Non-Veg Rolls", "180.00"),
            roll("Dbl Egg Chicken Kathi Roll", "Non-Veg Rolls", "150.00"),
            roll("Dbl Egg Dbl Kathi Roll", "Non-Veg Rolls", "200.00"),
            roll("Chicken Tikka Kabab Roll", "Non-Veg Rolls", "160.00"),
            roll("Dbl Chicken Tikka Roll", "Non-Veg Rolls", "250.00"),
            roll("Chicken Tikka Kabab Egg Roll", "Non-Veg Rolls", "170.00"),
            roll("Dbl Egg Tikka Roll", "Non-Veg Rolls", "180.00"),
            roll("Dbl Egg Dbl Tikka Roll", "Non-Veg Rolls", "270.00"),
            roll("Chicken Reshmi Roll", "Non-Veg Rolls", "160.00"),
            roll("Chicken Reshmi Egg Roll", "Non-Veg Rolls", "170.00"),
            roll("Dbl Chicken Reshmi Roll", "Non-Veg Rolls", "250.00"),
            roll("Dbl Egg Reshmi Roll", "Non-Veg Rolls", "190.00"),
            roll("Dbl Egg Dbl Chicken Reshmi Roll", "Non-Veg Rolls", "270.00"),
            roll("Seek Roll", "Non-Veg Rolls", "130.00"),
            roll("Seek Egg Roll", "Non-Veg Rolls", "140.00"),
            roll("Dbl Egg Seek Roll", "Non-Veg Rolls", "150.00"),

            // Non Veg Roll column above the Kabab section.
            roll("Egg Cheese Roll", "Non-Veg Rolls", "150.00"),
            roll("Dbl Egg Cheese Roll", "Non-Veg Rolls", "160.00"),
            roll("Chicken Cheese Roll", "Non-Veg Rolls", "170.00"),
            roll("Dbl Chicken Cheese Roll", "Non-Veg Rolls", "200.00"),
            roll("Dbl Egg Chicken Cheese Roll", "Non-Veg Rolls", "190.00"),
            roll("Paneer Egg Roll", "Non-Veg Rolls", "120.00"),
            roll("Dbl Egg Paneer Roll", "Non-Veg Rolls", "130.00"),
            roll("Dbl Paneer Egg Roll", "Non-Veg Rolls", "160.00"),
            roll("Dbl Egg Dbl Paneer Roll", "Non-Veg Rolls", "170.00")
    );

    @Bean
    CommandLineRunner seedMenu(MenuItemRepository menu, SeedStateRepository seedState,
            PlatformTransactionManager transactionManager) {
        return args -> new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            if (seedState.existsById(ROLL_MENU_VERSION)) return;

            List<MenuItem> existing = new ArrayList<>(menu.findAll());
            if (seedState.existsById(OLD_DEMO_VERSION)) {
                // Remove only an intact, untouched copy of the nine original demo items.
                // If staff edited even one, leave the existing menu alone.
                List<MenuItem> oldDemo = OLD_DEMO_ITEMS.stream()
                        .map(spec -> existing.stream().filter(spec::matches).findFirst().orElse(null))
                        .toList();
                if (oldDemo.stream().allMatch(item -> item != null)) {
                    menu.deleteAll(oldDemo);
                    existing.removeAll(oldDemo);
                }
            }

            Set<String> existingNames = existing.stream()
                    .map(item -> key(item.getName(), item.getCategory()))
                    .collect(Collectors.toSet());
            List<MenuItem> additions = new ArrayList<>();
            for (SeedItem spec : PHOTO_ROLLS) {
                if (existingNames.add(key(spec.name(), spec.category()))) {
                    additions.add(new MenuItem(spec.name(), spec.category(), spec.price(), true));
                }
            }
            menu.saveAll(additions);
            seedState.save(new SeedState(ROLL_MENU_VERSION));
        });
    }

    private static String key(String name, String category) {
        return category.trim().toLowerCase() + "\n" + name.trim().toLowerCase();
    }

    private static SeedItem roll(String name, String category, String price) {
        return new SeedItem(name, category, new BigDecimal(price));
    }

    private record SeedItem(String name, String category, BigDecimal price) {
        boolean matches(MenuItem item) {
            return item.isAvailable() && name.equals(item.getName())
                    && category.equals(item.getCategory()) && price.compareTo(item.getPrice()) == 0;
        }
    }
}
