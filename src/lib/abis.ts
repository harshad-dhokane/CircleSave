// Auto-generated from compiled Cairo contracts
// DO NOT EDIT MANUALLY - run 'scarb build' and regenerate

export const CIRCLE_FACTORY_ABI = [
  {
    "type": "impl",
    "name": "CircleFactoryImpl",
    "interface_name": "circlesave::types::ICircleFactory"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "enum",
    "name": "circlesave::types::CircleType",
    "variants": [
      {
        "name": "OPEN",
        "type": "()"
      },
      {
        "name": "APPROVAL_REQUIRED",
        "type": "()"
      },
      {
        "name": "INVITE_ONLY",
        "type": "()"
      }
    ]
  },
  {
    "type": "enum",
    "name": "circlesave::types::CircleCategory",
    "variants": [
      {
        "name": "FRIENDS",
        "type": "()"
      },
      {
        "name": "FAMILY",
        "type": "()"
      },
      {
        "name": "COWORKERS",
        "type": "()"
      },
      {
        "name": "NEIGHBORS",
        "type": "()"
      },
      {
        "name": "INTEREST",
        "type": "()"
      }
    ]
  },
  {
    "type": "enum",
    "name": "circlesave::types::CircleStatus",
    "variants": [
      {
        "name": "PENDING",
        "type": "()"
      },
      {
        "name": "ACTIVE",
        "type": "()"
      },
      {
        "name": "COMPLETED",
        "type": "()"
      },
      {
        "name": "FAILED",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "circlesave::types::CircleInfo",
    "members": [
      {
        "name": "id",
        "type": "core::integer::u256"
      },
      {
        "name": "name",
        "type": "core::felt252"
      },
      {
        "name": "description",
        "type": "core::felt252"
      },
      {
        "name": "monthly_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "max_members",
        "type": "core::integer::u8"
      },
      {
        "name": "current_members",
        "type": "core::integer::u8"
      },
      {
        "name": "circle_type",
        "type": "circlesave::types::CircleType"
      },
      {
        "name": "category",
        "type": "circlesave::types::CircleCategory"
      },
      {
        "name": "collateral_ratio",
        "type": "core::integer::u8"
      },
      {
        "name": "status",
        "type": "circlesave::types::CircleStatus"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "current_month",
        "type": "core::integer::u8"
      },
      {
        "name": "contract_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "interface",
    "name": "circlesave::types::ICircleFactory",
    "items": [
      {
        "type": "function",
        "name": "create_circle",
        "inputs": [
          {
            "name": "name",
            "type": "core::felt252"
          },
          {
            "name": "description",
            "type": "core::felt252"
          },
          {
            "name": "monthly_amount",
            "type": "core::integer::u256"
          },
          {
            "name": "max_members",
            "type": "core::integer::u8"
          },
          {
            "name": "circle_type",
            "type": "circlesave::types::CircleType"
          },
          {
            "name": "category",
            "type": "circlesave::types::CircleCategory"
          },
          {
            "name": "collateral_ratio",
            "type": "core::integer::u8"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_circles",
        "inputs": [
          {
            "name": "offset",
            "type": "core::integer::u32"
          },
          {
            "name": "limit",
            "type": "core::integer::u32"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<circlesave::types::CircleInfo>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_circles",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<circlesave::types::CircleInfo>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_circle_count",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u32"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_circle_by_id",
        "inputs": [
          {
            "name": "id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "circlesave::types::CircleInfo"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "update_reputation_contract",
        "inputs": [
          {
            "name": "new_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "update_collateral_manager",
        "inputs": [
          {
            "name": "new_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "circle_class_hash",
        "type": "core::starknet::class_hash::ClassHash"
      },
      {
        "name": "reputation_contract",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "collateral_manager",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle_factory::CircleFactory::CircleCreated",
    "kind": "struct",
    "members": [
      {
        "name": "circle_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "contract_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "name",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle_factory::CircleFactory::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "CircleCreated",
        "type": "circlesave::circle_factory::CircleFactory::CircleCreated",
        "kind": "nested"
      }
    ]
  }
] as const;

export const CIRCLE_ABI = [
  {
    "type": "impl",
    "name": "CircleImpl",
    "interface_name": "circlesave::types::ICircle"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "enum",
    "name": "circlesave::types::CircleType",
    "variants": [
      {
        "name": "OPEN",
        "type": "()"
      },
      {
        "name": "APPROVAL_REQUIRED",
        "type": "()"
      },
      {
        "name": "INVITE_ONLY",
        "type": "()"
      }
    ]
  },
  {
    "type": "enum",
    "name": "circlesave::types::CircleCategory",
    "variants": [
      {
        "name": "FRIENDS",
        "type": "()"
      },
      {
        "name": "FAMILY",
        "type": "()"
      },
      {
        "name": "COWORKERS",
        "type": "()"
      },
      {
        "name": "NEIGHBORS",
        "type": "()"
      },
      {
        "name": "INTEREST",
        "type": "()"
      }
    ]
  },
  {
    "type": "enum",
    "name": "circlesave::types::CircleStatus",
    "variants": [
      {
        "name": "PENDING",
        "type": "()"
      },
      {
        "name": "ACTIVE",
        "type": "()"
      },
      {
        "name": "COMPLETED",
        "type": "()"
      },
      {
        "name": "FAILED",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "circlesave::types::CircleInfo",
    "members": [
      {
        "name": "id",
        "type": "core::integer::u256"
      },
      {
        "name": "name",
        "type": "core::felt252"
      },
      {
        "name": "description",
        "type": "core::felt252"
      },
      {
        "name": "monthly_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "max_members",
        "type": "core::integer::u8"
      },
      {
        "name": "current_members",
        "type": "core::integer::u8"
      },
      {
        "name": "circle_type",
        "type": "circlesave::types::CircleType"
      },
      {
        "name": "category",
        "type": "circlesave::types::CircleCategory"
      },
      {
        "name": "collateral_ratio",
        "type": "core::integer::u8"
      },
      {
        "name": "status",
        "type": "circlesave::types::CircleStatus"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64"
      },
      {
        "name": "current_month",
        "type": "core::integer::u8"
      },
      {
        "name": "contract_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "circlesave::types::Member",
    "members": [
      {
        "name": "address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "joined_at",
        "type": "core::integer::u64"
      },
      {
        "name": "collateral_locked",
        "type": "core::integer::u256"
      },
      {
        "name": "payments_made",
        "type": "core::integer::u8"
      },
      {
        "name": "payments_late",
        "type": "core::integer::u8"
      },
      {
        "name": "has_received_pot",
        "type": "core::bool"
      },
      {
        "name": "is_active",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "enum",
    "name": "circlesave::types::PaymentStatus",
    "variants": [
      {
        "name": "PENDING",
        "type": "()"
      },
      {
        "name": "PAID",
        "type": "()"
      },
      {
        "name": "LATE",
        "type": "()"
      },
      {
        "name": "MISSED",
        "type": "()"
      }
    ]
  },
  {
    "type": "interface",
    "name": "circlesave::types::ICircle",
    "items": [
      {
        "type": "function",
        "name": "join",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "request_join",
        "inputs": [
          {
            "name": "message",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "approve_member",
        "inputs": [
          {
            "name": "applicant",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "reject_member",
        "inputs": [
          {
            "name": "applicant",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "contribute",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "distribute_pot",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "start_circle",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "complete_circle",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "emergency_withdraw",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_info",
        "inputs": [],
        "outputs": [
          {
            "type": "circlesave::types::CircleInfo"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_members",
        "inputs": [],
        "outputs": [
          {
            "type": "core::array::Array::<circlesave::types::Member>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_member",
        "inputs": [
          {
            "name": "address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "circlesave::types::Member"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_payment_status",
        "inputs": [
          {
            "name": "member",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "month",
            "type": "core::integer::u8"
          }
        ],
        "outputs": [
          {
            "type": "circlesave::types::PaymentStatus"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_rotation_queue",
        "inputs": [],
        "outputs": [
          {
            "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_current_pot",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_collateral_required",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_member",
        "inputs": [
          {
            "name": "address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_creator",
        "inputs": [
          {
            "name": "address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_pending_applicants",
        "inputs": [],
        "outputs": [
          {
            "type": "core::array::Array::<(core::starknet::contract_address::ContractAddress, core::felt252)>"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "id",
        "type": "core::integer::u256"
      },
      {
        "name": "name",
        "type": "core::felt252"
      },
      {
        "name": "description",
        "type": "core::felt252"
      },
      {
        "name": "monthly_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "max_members",
        "type": "core::integer::u8"
      },
      {
        "name": "circle_type",
        "type": "circlesave::types::CircleType"
      },
      {
        "name": "category",
        "type": "circlesave::types::CircleCategory"
      },
      {
        "name": "collateral_ratio",
        "type": "core::integer::u8"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "reputation_contract",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "collateral_manager",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::MemberJoined",
    "kind": "struct",
    "members": [
      {
        "name": "member",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "collateral_locked",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::MemberApproved",
    "kind": "struct",
    "members": [
      {
        "name": "applicant",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "approved_by",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::ContributionMade",
    "kind": "struct",
    "members": [
      {
        "name": "member",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "month",
        "type": "core::integer::u8",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::PotDistributed",
    "kind": "struct",
    "members": [
      {
        "name": "recipient",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "month",
        "type": "core::integer::u8",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::CircleStarted",
    "kind": "struct",
    "members": [
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "first_recipient",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::CircleCompleted",
    "kind": "struct",
    "members": [
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "total_volume",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::PaymentMissed",
    "kind": "struct",
    "members": [
      {
        "name": "member",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "month",
        "type": "core::integer::u8",
        "kind": "data"
      },
      {
        "name": "collateral_slashed",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::CollateralSlashed",
    "kind": "struct",
    "members": [
      {
        "name": "member",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "reason",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::circle::Circle::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "MemberJoined",
        "type": "circlesave::circle::Circle::MemberJoined",
        "kind": "nested"
      },
      {
        "name": "MemberApproved",
        "type": "circlesave::circle::Circle::MemberApproved",
        "kind": "nested"
      },
      {
        "name": "ContributionMade",
        "type": "circlesave::circle::Circle::ContributionMade",
        "kind": "nested"
      },
      {
        "name": "PotDistributed",
        "type": "circlesave::circle::Circle::PotDistributed",
        "kind": "nested"
      },
      {
        "name": "CircleStarted",
        "type": "circlesave::circle::Circle::CircleStarted",
        "kind": "nested"
      },
      {
        "name": "CircleCompleted",
        "type": "circlesave::circle::Circle::CircleCompleted",
        "kind": "nested"
      },
      {
        "name": "PaymentMissed",
        "type": "circlesave::circle::Circle::PaymentMissed",
        "kind": "nested"
      },
      {
        "name": "CollateralSlashed",
        "type": "circlesave::circle::Circle::CollateralSlashed",
        "kind": "nested"
      }
    ]
  }
] as const;

export const REPUTATION_ABI = [
  {
    "type": "impl",
    "name": "ReputationImpl",
    "interface_name": "circlesave::types::IReputation"
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "circlesave::types::UserStats",
    "members": [
      {
        "name": "circles_joined",
        "type": "core::integer::u32"
      },
      {
        "name": "circles_created",
        "type": "core::integer::u32"
      },
      {
        "name": "payments_made",
        "type": "core::integer::u32"
      },
      {
        "name": "payments_late",
        "type": "core::integer::u32"
      },
      {
        "name": "total_volume",
        "type": "core::integer::u256"
      },
      {
        "name": "current_collateral",
        "type": "core::integer::u256"
      },
      {
        "name": "reputation_score",
        "type": "core::integer::u16"
      }
    ]
  },
  {
    "type": "interface",
    "name": "circlesave::types::IReputation",
    "items": [
      {
        "type": "function",
        "name": "record_payment",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "circle",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "on_time",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "record_circle_joined",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "record_circle_created",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "record_circle_completed",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "award_badge",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "badge_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "calculate_level",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_stats",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "circlesave::types::UserStats"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_badges",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<core::felt252>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "has_badge",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "badge_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_reputation_score",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u16"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": []
  },
  {
    "type": "function",
    "name": "authorize_contract",
    "inputs": [
      {
        "name": "contract",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "revoke_contract",
    "inputs": [
      {
        "name": "contract",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "update_collateral",
    "inputs": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "event",
    "name": "circlesave::reputation::Reputation::BadgeAwarded",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "badge_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::reputation::Reputation::StatsUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "circles_joined",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "payments_made",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "reputation_score",
        "type": "core::integer::u16",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::reputation::Reputation::LevelUp",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_level",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::reputation::Reputation::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "BadgeAwarded",
        "type": "circlesave::reputation::Reputation::BadgeAwarded",
        "kind": "nested"
      },
      {
        "name": "StatsUpdated",
        "type": "circlesave::reputation::Reputation::StatsUpdated",
        "kind": "nested"
      },
      {
        "name": "LevelUp",
        "type": "circlesave::reputation::Reputation::LevelUp",
        "kind": "nested"
      }
    ]
  }
] as const;

export const COLLATERAL_MANAGER_ABI = [
  {
    "type": "impl",
    "name": "CollateralManagerImpl",
    "interface_name": "circlesave::types::ICollateralManager"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "interface",
    "name": "circlesave::types::ICollateralManager",
    "items": [
      {
        "type": "function",
        "name": "lock_collateral",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "release_collateral",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "slash_collateral",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          },
          {
            "name": "recipient",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_locked_collateral",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_total_locked",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "reputation_contract",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "function",
    "name": "authorize_contract",
    "inputs": [
      {
        "name": "contract",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "revoke_contract",
    "inputs": [
      {
        "name": "contract",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "set_reputation_contract",
    "inputs": [
      {
        "name": "new_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "emergency_withdraw",
    "inputs": [
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "event",
    "name": "circlesave::collateral_manager::CollateralManager::CollateralLocked",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "new_total",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::collateral_manager::CollateralManager::CollateralReleased",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "new_total",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::collateral_manager::CollateralManager::CollateralSlashed",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "recipient",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "reason",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "circlesave::collateral_manager::CollateralManager::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "CollateralLocked",
        "type": "circlesave::collateral_manager::CollateralManager::CollateralLocked",
        "kind": "nested"
      },
      {
        "name": "CollateralReleased",
        "type": "circlesave::collateral_manager::CollateralManager::CollateralReleased",
        "kind": "nested"
      },
      {
        "name": "CollateralSlashed",
        "type": "circlesave::collateral_manager::CollateralManager::CollateralSlashed",
        "kind": "nested"
      }
    ]
  }
] as const;

export const ERC20_ABI = [
  {
    "type": "interface",
    "name": "IERC20",
    "items": [
      {
        "type": "function",
        "name": "name",
        "inputs": [],
        "outputs": [{"type": "core::felt252"}],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "symbol",
        "inputs": [],
        "outputs": [{"type": "core::felt252"}],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "decimals",
        "inputs": [],
        "outputs": [{"type": "core::integer::u8"}],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "total_supply",
        "inputs": [],
        "outputs": [{"type": "core::integer::u256"}],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "balance_of",
        "inputs": [{"name": "account", "type": "core::starknet::contract_address::ContractAddress"}],
        "outputs": [{"type": "core::integer::u256"}],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "allowance",
        "inputs": [
          {"name": "owner", "type": "core::starknet::contract_address::ContractAddress"},
          {"name": "spender", "type": "core::starknet::contract_address::ContractAddress"}
        ],
        "outputs": [{"type": "core::integer::u256"}],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "transfer",
        "inputs": [
          {"name": "recipient", "type": "core::starknet::contract_address::ContractAddress"},
          {"name": "amount", "type": "core::integer::u256"}
        ],
        "outputs": [{"type": "core::bool"}],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transfer_from",
        "inputs": [
          {"name": "sender", "type": "core::starknet::contract_address::ContractAddress"},
          {"name": "recipient", "type": "core::starknet::contract_address::ContractAddress"},
          {"name": "amount", "type": "core::integer::u256"}
        ],
        "outputs": [{"type": "core::bool"}],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "approve",
        "inputs": [
          {"name": "spender", "type": "core::starknet::contract_address::ContractAddress"},
          {"name": "amount", "type": "core::integer::u256"}
        ],
        "outputs": [{"type": "core::bool"}],
        "state_mutability": "external"
      }
    ]
  }
] as const;
