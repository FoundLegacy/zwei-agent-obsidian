import * as Popover from '@radix-ui/react-popover'
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  Coins,
  Cpu,
  Database,
  Info,
  Zap,
} from 'lucide-react'

import { ResponseUsage } from '../../types/llm/response'

type LLMResponseInfoProps = {
  usage: ResponseUsage | null
  estimatedPrice: number | null
  model: string | null
}

export default function LLMResponseInfoPopover({
  usage,
  estimatedPrice,
  model,
}: LLMResponseInfoProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="clickable-icon">
          <Info size={12} />
        </button>
      </Popover.Trigger>
      {usage ? (
        <Popover.Content className="za-popover-content za-llm-info-content">
          <div className="za-llm-info-header">LLM Response Information</div>
          <div className="za-llm-info-tokens">
            <div className="za-llm-info-tokens-header">Token Count</div>
            <div className="za-llm-info-tokens-grid">
              <div className="za-llm-info-token-row">
                <ArrowUp className="za-llm-info-icon--input" />
                <span>Input:</span>
                <span className="za-llm-info-token-value">
                  {usage.prompt_tokens.toLocaleString()}
                </span>
              </div>
              <div className="za-llm-info-token-row">
                <ArrowDown className="za-llm-info-icon--output" />
                <span>Output:</span>
                <span className="za-llm-info-token-value">
                  {usage.completion_tokens.toLocaleString()}
                </span>
              </div>
              {((usage.prompt_tokens_details?.cached_tokens != null &&
                 usage.prompt_tokens_details.cached_tokens > 0) ||
                 (usage.prompt_cache_hit_tokens != null &&
                  usage.prompt_cache_hit_tokens > 0)) && (
                  <>
                    <div className="za-llm-info-token-row">
                      <Database className="za-llm-info-icon--cache" />
                      <span>Cache hit:</span>
                      <span className="za-llm-info-token-value">
                        {(usage.prompt_cache_hit_tokens ??
                          usage.prompt_tokens_details?.cached_tokens)!.toLocaleString()}
                      </span>
                    </div>
                    <div className="za-llm-info-token-row">
                      <Zap className="za-llm-info-icon--miss" />
                      <span>Cache miss:</span>
                      <span className="za-llm-info-token-value">
                        {(usage.prompt_cache_miss_tokens ??
                          ((usage.prompt_tokens_details?.cached_tokens != null &&
                            usage.prompt_tokens_details.cached_tokens > 0)
                            ? usage.prompt_tokens - (usage.prompt_tokens_details.cached_tokens ?? 0)
                            : 0)).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              <div className="za-llm-info-token-row za-llm-info-token-total">
                <ArrowRightLeft className="za-llm-info-icon--total" />
                <span>Total:</span>
                <span className="za-llm-info-token-value">
                  {usage.total_tokens.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="za-llm-info-footer-row">
            <Coins className="za-llm-info-icon--footer" />
            <span>Estimated Price:</span>
            <span className="za-llm-info-footer-value">
              {estimatedPrice === null
                ? 'Not available'
                : `$${estimatedPrice.toFixed(4)}`}
            </span>
          </div>
          <div className="za-llm-info-footer-row">
            <Cpu className="za-llm-info-icon--footer" />
            <span>Model:</span>
            <span className="za-llm-info-footer-value za-llm-info-model">
              {model ?? 'Not available'}
            </span>
          </div>
        </Popover.Content>
      ) : (
        <Popover.Content className="za-popover-content">
          <div>Usage statistics are not available for this model</div>
        </Popover.Content>
      )}
    </Popover.Root>
  )
}
