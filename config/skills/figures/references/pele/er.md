# Entity relationship

Use for: Database entities, their keys and how they relate (one-to-many and so on).

Keyword: `erDiagram`

```mermaid
erDiagram
    subgraph title1
        CUSTOMER
        CUSTOMER {
            string name
            string custNumber
            string sector
        }
    end
    subgraph title2
        CAR ||--o{ NAMED-DRIVER : allows
        subgraph title3
            PERSON
            PERSON {
                string firstName
                string lastName
                int age
            }
        end
    end
```

```mermaid
erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    CAR {
        string registrationNumber PK
        string make
        string model
        string[] parts
    }
    PERSON ||--o{ NAMED-DRIVER : is
    PERSON {
        string driversLicense PK "The license #"
        string(99) firstName "Only 99 characters are allowed"
        string lastName
        string phone UK
        int age
    }
    NAMED-DRIVER {
        string carRegistrationNumber PK, FK
        string driverLicense PK, FK
    }
    MANUFACTURER only one to zero or more CAR : makes
```

Entities with several relationships:

```mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  CUSTOMER }|..|{ ADDRESS : uses
  ORDER }o--|| ADDRESS : "ships to"
  PRODUCT ||--o{ LINE_ITEM : "appears in"
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [Entity relationship examples](https://pele.run/examples/er).
