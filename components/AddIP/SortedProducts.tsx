import { getSortedPrices, type Price, type Product } from '@/hooks/useProducts'
import { memo, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select'
import { formatNumber } from '@/lib/types'

export const SortedProducts = memo(
  ({
    products,
    value,
    onSelect,
  }: {
    products: Record<string, Product>
    value: Price[] | undefined
    onSelect: (select: Price[]) => void
  }) => {
    const order = ['day', 'week', 'month']
    const sortedProducts = useMemo(
      () =>
        Object.values(products)
          .filter((product) => order.indexOf(product.metadata?.duration) !== -1)
          .map((product) => ({
            ...product,
            order: order.indexOf(product.metadata?.duration),
          }))
          .sort((a, b) => {
            return a.order - b.order
          }),
      [products]
    )

    const defaultPrices = useMemo<Price[]>(() => {
      return sortedProducts.map(
        (product) => getSortedPrices(product.prices)[0]
      ) as Price[]
    }, [sortedProducts])

    return sortedProducts.map((product, index) => {
      const sortedPrices = getSortedPrices(product.prices)
      return (
        <div key={product.id} className="flex flex-col">
          <div className="flex items-center space-x-2 p-3 border bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
            <Select
              value={value?.[index]?.id || defaultPrices[index].id}
              onValueChange={(_priceValue: string) => {
                const priceValue = _priceValue === '__none__' ? '' : _priceValue
                const newPrice = sortedPrices.find(
                  (price) => price.id === priceValue
                )
                const newPrices: Price[] = value
                  ? [...value]
                  : [...defaultPrices]
                newPrices[index] = newPrice as Price
                console.log('newPrices', newPrices)
                onSelect(newPrices)
              }}
            >
              <SelectTrigger className="flex flex-row justify-items-start">
                {value?.[index] && value?.[index]?.id !== ''
                  ? formatNumber(
                      (value[index].unit_amount || 0) / 100,
                      'currency',
                      value[index]?.currency?.toUpperCase?.() || 'USD'
                    )
                  : '-- NA --'}
                <div className="text-xs text-foreground/60">{product.name}</div>
              </SelectTrigger>
              <SelectContent>
                {sortedPrices.map((price) => (
                  <SelectItem key={price.id} value={price.id || '__none__'}>
                    {price.id !== ''
                      ? formatNumber(
                          price.unit_amount / 100,
                          'currency',
                          price?.currency || 'USD'
                        )
                      : '-- NA --'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>{product.description}</div>
        </div>
      )
    })
  }
)
